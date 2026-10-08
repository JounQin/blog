import { translateByDeepLX } from '@deeplx/core'
import { $fetch } from 'ofetch'

import { LOCALE_COOKIE, Locale, TOGGLE_LOCALE, isLocale } from '../../shared/utils/locale'
import { getEnv } from '../utils/env'

/**
 * Translation endpoint used by the `[en]…[zh]…[_end_]` DSL.
 *
 * Powered by `@deeplx/core`, which talks to DeepL's free endpoints, so no API
 * key or other environment variable is required. When `DEEPLX_URL` is set
 * (e.g. `https://<your-dlx-host>`) a self-hosted DLX instance
 * (https://github.com/OwO-Network/DLX) is used as a **fallback**: only a chunk
 * whose library attempts failed or that the library echoed unchanged gets one
 * request to `<DEEPLX_URL>/translate` with an optional `DEEPLX_TOKEN` bearer
 * header and a shorter 4 s budget. The
 * endpoint should serve `/translate` directly: redirects are followed, but a
 * 301/302/303 becomes a GET and drops the body, so only a method-preserving
 * redirect (307/308) still carries the POST. With `DEEPLX_URL` unset the
 * behaviour is exactly the library-only one, which keeps the fallback reversible.
 *
 * `POST` only, with a JSON body `{ text | sourceText, source?, target?, retry? }`,
 * so a long article body never has to fit into a URL.
 *
 * `source` (the language of the text) is passed to both providers when the
 * caller gives it. When it is missing the provider detects the language itself
 * -- that is how untagged text is translated -- and `target` then says which
 * language to produce; without `target` it is derived from `source`, or from the
 * locale cookie, exactly as before. Note that the anonymous endpoint mirrors a
 * given `source_lang` as `detected_source_language` whenever its own detection is
 * not confident, so an accurate tag helps and a wrong one can cause an echo.
 */
const DEEPL_LOCALES: Record<Locale, string> = {
  [Locale.EN]: 'EN',
  [Locale.ZH]: 'ZH',
}

/** `@deeplx/core` rejects anything longer than the anonymous oneshot limit. */
const MAX_CHARS = 1500
// a cold isolate pays a cookie warm-up request first, so the budget is generous
// (measured ~2 s per translation from node, including the session warm-up)
const CHUNK_TIMEOUT = 8000
/**
 * The fallback gets its own, shorter budget. It runs after the library path, so
 * on the SSR prefetch (one library attempt) a worst-case chunk waits 8 s for the
 * library plus 4 s here -- 12 s instead of the 16 s a second 8 s would cost. A
 * client-triggered call allows two library attempts (20 s worst case).
 */
const FALLBACK_TIMEOUT = 4000

/** Appended to `DEEPLX_URL`, which itself must not carry a trailing slash. */
const DEEPLX_PATH = '/translate'

/**
 * `caches.default` is the only shared cache this Worker already has, so a
 * translated payload is stored there under a synthetic GET key (the endpoint
 * itself is POST) and served from the edge cache on the next render. A
 * `translated: true` result lives for a day; a result that fell back to the
 * source text is kept for five minutes only, so a transient provider outage
 * cannot stick for a day.
 */
const CACHE_TTL = 60 * 60 * 24
const CACHE_FAILURE_TTL = 60 * 5
/** A reserved TLD, so the synthetic key can never collide with a real site. */
const CACHE_ORIGIN = 'https://translate-cache.internal'

/** `caches.default` is not typed without the Workers types; stay structural. */
interface TranslationCache {
  match: (request: Request) => Promise<Response | undefined>
  put: (request: Request, response: Response) => Promise<void>
}

const translationCache = (
  globalThis as { caches?: { default?: TranslationCache } }
).caches?.default

interface TranslatePayload {
  text: string
  translated: boolean
}

/** SHA-256 hex of the text, so a long body still gets a short cache key. */
const digest = async (value: string): Promise<string> => {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  )
  return [...new Uint8Array(bytes)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

type TargetLanguage = Parameters<typeof translateByDeepLX>[1]
type SourceLanguage = NonNullable<Parameters<typeof translateByDeepLX>[0]>

/** Self-hosted DLX. Both env vars are optional: `DEEPLX_URL` alone already
 * enables the fallback, and no `authorization` header is sent without a token. */
interface DlxService {
  url?: string
  token?: string
}

/** DLX answers `{ code, data, ... }`: `data` is the translation on success. */
interface DlxResponse {
  code?: number
  data?: unknown
  message?: string
}

/**
 * Splits a possibly long (HTML) text into chunks of at most `MAX_CHARS`
 * characters, preferring boundaries that cannot break a tag or an entity.
 */
const splitText = (text: string, size = MAX_CHARS): string[] => {
  if ([...text].length <= size) {
    return [text]
  }

  const chunks: string[] = []
  let rest = text

  while ([...rest].length > size) {
    const window = [...rest].slice(0, size).join('')
    let cut = Math.max(
      window.lastIndexOf('\n'),
      window.lastIndexOf('>'),
      window.lastIndexOf(' '),
    )

    if (cut <= 0) {
      cut = window.length
    } else {
      cut += 1
    }

    chunks.push(rest.slice(0, cut))
    rest = rest.slice(cut)
  }

  if (rest) {
    chunks.push(rest)
  }

  return chunks
}

/** Client-triggered calls may retry once (warm-up, transient 5xx, timeouts).
 * The SSR prefetch never retries (see below), so a slow provider cannot
 * multiply the render latency. */
const MAX_ATTEMPTS = 2

/**
 * One primary attempt through `@deeplx/core`, which talks to DeepL's anonymous
 * oneshot endpoint. A caller-provided source is passed through; without one the
 * provider detects the language itself. `translateByDeepLX` reports failures as
 * values (`{ code, message }`), so the retry decision is a plain check on the
 * result.
 */
const translateWithLibrary = (
  chunk: string,
  target: TargetLanguage,
  source: SourceLanguage | undefined,
): ReturnType<typeof translateByDeepLX> =>
  translateByDeepLX(
    source,
    target,
    chunk,
    undefined,
    undefined,
    AbortSignal.timeout(CHUNK_TIMEOUT),
  )

/**
 * One fallback request to the self-hosted DLX service. The origin (host, port
 * and any path prefix) comes from `DEEPLX_URL` verbatim and only `/translate`
 * is appended, so nothing here is host or port specific. `source_lang` is sent
 * when the caller named a source and omitted otherwise (JSON drops `undefined`),
 * so the DLX detects the language itself exactly when the library does.
 *
 * Redirects are followed (the runtime default), but the endpoint should serve
 * `/translate` directly: a 301/302/303 is re-issued as a GET and drops the JSON
 * body, so only a method-preserving redirect (307/308) still translates. The
 * `authorization` header goes to the configured origin on the first request.
 * `ignoreResponseError` keeps ofetch from throwing on a non-2xx, so the status of
 * the final response can be inspected here.
 *
 * It counts as a success only when the final HTTP status is 200, the JSON `code`
 * is 200 and `data` is a non-empty string other than the input; anything else
 * (429, an auth failure whose body may not even be JSON, an empty payload or an
 * unchanged answer) throws. The token is never logged.
 */
const translateWithDlx = async (
  chunk: string,
  target: TargetLanguage,
  source: SourceLanguage | undefined,
  service: DlxService,
): Promise<string> => {
  const url = service.url

  // the caller only takes this path when `DEEPLX_URL` is set; the guard keeps the
  // optional env type honest instead of fetching `undefined/translate`
  if (!url) {
    throw new Error('DEEPLX_URL is not configured')
  }

  const response = await $fetch.raw<DlxResponse>(`${url}${DEEPLX_PATH}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(service.token && { authorization: `Bearer ${service.token}` }),
    },
    body: {
      text: chunk,
      // omitted for auto-detection: JSON.stringify drops an undefined value
      source_lang: source,
      target_lang: target,
    },
    // exactly one fallback request: ofetch does not retry POST by default
    redirect: 'follow',
    ignoreResponseError: true,
    signal: AbortSignal.timeout(FALLBACK_TIMEOUT),
  })

  if (response.status !== 200) {
    console.warn(
      '[translate] DLX answered with a non-200 status',
      `status=${response.status}`,
      `length=${chunk.length}`,
    )
    throw new Error(`DLX responded with HTTP ${response.status}`)
  }

  // ofetch parses the body into `_data` (destr, so a non-JSON body stays a string)
  const payload: DlxResponse | undefined = response._data
  const { code, data } = payload ?? {}

  if (code !== 200 || typeof data !== 'string' || !data) {
    throw new Error(`DLX responded with HTTP 200, code ${code}`)
  }

  if (data === chunk) {
    throw new Error('DLX returned the source text unchanged')
  }

  return data
}

const translateChunk = async (
  chunk: string,
  target: TargetLanguage,
  source: SourceLanguage | undefined,
  attempts: number,
  service: DlxService,
): Promise<{ text: string; ok: boolean }> => {
  // primary: the `@deeplx/core` library, up to `attempts` tries. It reports its
  // outcome as a value, so the retry decision is a plain check on `code`
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const result = await translateWithLibrary(chunk, target, source)

      // a 200 with a non-empty string is a real response
      if (
        result.code === 200 &&
        'data' in result &&
        typeof result.data === 'string' &&
        result.data
      ) {
        if (result.data === chunk) {
          // The library's anonymous profile echoes short, ambiguous or mixed
          // chunks unchanged (it also mirrors the requested `source_lang` as
          // `detected_source_language` when its detection is not confident), so
          // retrying it with the same profile is pointless. The self-hosted DLX
          // answers with a different client profile -- the iOS one -- which is the
          // path that can still translate such a chunk, so stop retrying here and
          // let the fallback try it once below.
          console.warn(
            '[translate] library returned the source text unchanged, falling back',
            `attempt=${attempt}/${attempts}`,
            `length=${chunk.length}`,
            `source=${source ?? 'auto'} target=${target}`,
          )
          break
        }

        return { text: result.data, ok: true }
      }

      // no usable response: log it (observability is enabled in wrangler.jsonc)
      // and decide whether another attempt is worth it
      console.warn(
        `[translate] library chunk failed (attempt ${attempt}/${attempts})`,
        `code=${result.code}`,
        `message=${'message' in result ? result.message : 'none'}`,
        `length=${chunk.length}`,
      )

      if (result.code >= 400 && result.code < 500) {
        // 4xx: DeepL rejected this request/profile, so a repeated call would be
        // rejected the same way; stop retrying and let the fallback try instead
        console.warn(
          '[translate] library rejected the request (4xx), not retrying',
          `code=${result.code}`,
          `length=${chunk.length}`,
        )
        break
      }
    } catch (error) {
      // `translateByDeepLX` reports failures as values, so this should not happen;
      // treat an unexpected throw like a retryable failure rather than failing the
      // whole route
      console.warn(
        `[translate] library threw (attempt ${attempt}/${attempts})`,
        String(error),
        `length=${chunk.length}`,
      )
    }
  }

  // fallback: one self-hosted DLX request, and only when it is configured. It runs
  // when the library really failed (a 4xx above, or a 5xx/unusable result that used
  // up the attempts) or echoed the chunk unchanged; a translated chunk never
  // reaches it, and without `DEEPLX_URL` the chunk simply keeps its source text.
  if (service.url) {
    console.warn(
      '[translate] falling back to the self-hosted DLX',
      `attempts=${attempts}`,
      `length=${chunk.length}`,
      `source=${source ?? 'auto'} target=${target}`,
    )

    try {
      return {
        text: await translateWithDlx(chunk, target, source, service),
        ok: true,
      }
    } catch (error) {
      console.warn(
        '[translate] DLX fallback failed',
        String(error),
        `length=${chunk.length}`,
      )
    }
  }

  return { text: chunk, ok: false }
}

export default defineEventHandler(async event => {
  // POST only (the file is `translate.post.ts`): the text travels in the JSON
  // body so a long article body never has to fit into a URL:
  //   { "text" | "sourceText": "...", "source"?: "en"|"zh", "target"?: "en"|"zh",
  //     "retry"?: true }
  // A malformed/empty body degrades to `{}`, i.e. an empty translation, not a 500.
  const params: Record<string, unknown> =
    ((await readBody(event).catch(() => null)) as Record<
      string,
      unknown
    > | null) ?? {}

  const text =
    typeof params.text === 'string'
      ? params.text
      : typeof params.sourceText === 'string'
        ? params.sourceText
        : ''

  if (!text) {
    return { text: '' }
  }

  const sourceLocale = isLocale(params.source) ? params.source : undefined
  const targetLocale = isLocale(params.target) ? params.target : undefined
  const cookie = getCookie(event, LOCALE_COOKIE)
  const cookieLocale = isLocale(cookie) ? cookie : Locale.EN

  // an explicit `source` is passed to both providers; only when the caller asks
  // for a `target` without one does the provider detect the language (untagged
  // text). With neither parameter the locale cookie supplies the source, exactly
  // as before, and `target` always wins over the derived one.
  const autoDetect = !sourceLocale && Boolean(targetLocale)
  const source = autoDetect
    ? undefined
    : (DEEPL_LOCALES[sourceLocale ?? cookieLocale] as SourceLanguage)
  const target = DEEPL_LOCALES[
    targetLocale ?? TOGGLE_LOCALE[sourceLocale ?? cookieLocale]
  ] as TargetLanguage

  // the SSR prefetch runs on every render, so a translated payload is cached in
  // the Worker's own cache (`caches.default`) under the target locale, the source
  // mode and a hash of the text; the first render pays, the next ones hit it
  const cacheKey = translationCache
    ? new Request(
        `${CACHE_ORIGIN}/?source=${source ?? 'auto'}&target=${target}&hash=${await digest(text)}`,
      )
    : undefined

  if (translationCache && cacheKey) {
    const hit = await translationCache.match(cacheKey).catch(() => undefined)
    const cached = hit
      ? ((await hit.json().catch(() => null)) as TranslatePayload | null)
      : null

    if (cached && typeof cached.text === 'string') {
      // visible in the Worker logs, so a repeated SSR render can be traced back
      // to the cache instead of the provider
      console.warn(
        '[translate] cache hit',
        `target=${target}`,
        `length=${text.length}`,
      )
      return cached
    }
  }

  // chunks are translated in parallel, and a chunk that fails (timeout, rate
  // limit, ...) keeps its original text, so a long article never blocks the SSR
  // only a client-triggered call may retry: the SSR prefetch awaits this route
  // before rendering, so retrying there would double the worst-case latency
  const attempts = params.retry ? MAX_ATTEMPTS : 1
  // read per request: Worker bindings are not available at module scope. Both
  // variables are optional and read independently, so a token alone configures
  // nothing and a URL alone already enables the fallback (without the header).
  const service: DlxService = {
    url: getEnv(event, 'DEEPLX_URL').replace(/\/+$/, ''),
    token: getEnv(event, 'DEEPLX_TOKEN'),
  }
  const chunks = splitText(text)
  const results = await Promise.all(
    chunks.map(chunk =>
      translateChunk(chunk, target, source, attempts, service),
    ),
  )

  const payload: TranslatePayload = {
    text: results.map(result => result.text).join(''),
    // the client keeps reading `text`; this reports whether any chunk had to
    // fall back to the source text (rate limit, timeout, endpoint error)
    translated: results.every(result => result.ok),
  }

  if (translationCache && cacheKey) {
    await translationCache
      .put(
        cacheKey,
        new Response(JSON.stringify(payload), {
          headers: {
            'content-type': 'application/json',
            'cache-control': `public, max-age=${
              payload.translated ? CACHE_TTL : CACHE_FAILURE_TTL
            }`,
          },
        }),
      )
      .catch(() => undefined)
    console.warn(
      '[translate] cache stored',
      `target=${target}`,
      `translated=${payload.translated}`,
      `length=${text.length}`,
    )
  }

  return payload
})
