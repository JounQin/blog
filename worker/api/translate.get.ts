import { translateByDeepLX } from '@deeplx/core'
import { $fetch } from 'ofetch'

import { LOCALE_COOKIE, Locale, TOGGLE_LOCALE } from '../../shared/utils/locale'
import { getEnv } from '../utils/env'

/**
 * Translation endpoint used by the `[en]…[zh]…[_end_]` DSL.
 *
 * Powered by `@deeplx/core`, which talks to DeepL's free endpoints, so no API
 * key or other environment variable is required. When `DEEPLX_URL` is set
 * (e.g. `https://<your-dlx-host>`) a self-hosted DLX instance
 * (https://github.com/OwO-Network/DLX) is used as a **fallback**: only a chunk
 * whose library attempts all failed gets one request to `<DEEPLX_URL>/translate`
 * with an optional `DEEPLX_TOKEN` bearer header and a shorter 4 s budget. The
 * endpoint should serve `/translate` directly: redirects are followed, but a
 * 301/302/303 becomes a GET and drops the body, so only a method-preserving
 * redirect (307/308) still carries the POST. With `DEEPLX_URL` unset the
 * behaviour is exactly the library-only one, which keeps the fallback reversible.
 * `Source` is the locale of `sourceText`; the target locale is the opposite one.
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
 * oneshot endpoint. `translateByDeepLX` reports failures as values
 * (`{ code, message }`), so the retry decision is a plain check on the result.
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
 * is appended, so nothing here is host or port specific.
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
          // The anonymous endpoint mirrors the requested `source_lang` as
          // `detected_source_language` whenever its detection is not confident, so
          // an identical output usually means the chunk had nothing to translate
          // rather than a decline. Retrying it, or asking the self-hosted DLX,
          // would not change that and would spend the operator's own DeepL quota
          // for nothing, so this is reported as not translated instead.
          console.warn(
            '[translate] library returned the source text unchanged, not retrying',
            `attempt=${attempt}/${attempts}`,
            `length=${chunk.length}`,
            `source=${source} target=${target}`,
          )
          return { text: chunk, ok: false }
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
  // for real failures only (a 4xx above, or a 5xx/unusable result that used up the
  // attempts); a translated or unchanged chunk never reaches it.
  if (service.url) {
    console.warn(
      '[translate] library path exhausted, falling back to the self-hosted DLX',
      `attempts=${attempts}`,
      `length=${chunk.length}`,
      `source=${source} target=${target}`,
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
  const query = getQuery(event)
  const text = typeof query.sourceText === 'string' ? query.sourceText : ''

  if (!text) {
    return { text: '' }
  }

  const requested =
    typeof query.source === 'string' && query.source
      ? query.source
      : getCookie(event, LOCALE_COOKIE)
  const locale = requested === Locale.ZH ? Locale.ZH : Locale.EN

  const target = DEEPL_LOCALES[TOGGLE_LOCALE[locale]] as TargetLanguage
  const source = DEEPL_LOCALES[locale] as SourceLanguage

  // chunks are translated in parallel, and a chunk that fails (timeout, rate
  // limit, ...) keeps its original text, so a long article never blocks the SSR
  // only a client-triggered call may retry: the SSR prefetch awaits this route
  // before rendering, so retrying there would double the worst-case latency
  const attempts = query.retry ? MAX_ATTEMPTS : 1
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

  return {
    text: results.map(result => result.text).join(''),
    // the client keeps reading `text`; this reports whether any chunk had to
    // fall back to the source text (rate limit, timeout, endpoint error)
    translated: results.every(result => result.ok),
  }
})
