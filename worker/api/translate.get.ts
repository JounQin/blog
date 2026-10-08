import { translate } from '@deeplx/core'
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
 * endpoint may redirect and we follow it, so an `http` -> `https` (or a path
 * prefix) deployment keeps working; the token only ever goes to the configured
 * origin on that first request. With `DEEPLX_URL` unset the behaviour is exactly
 * the library-only one, which keeps the fallback reversible.
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

type TargetLanguage = Parameters<typeof translate>[1]
type SourceLanguage = NonNullable<Parameters<typeof translate>[2]>

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
 * Whether the chunk holds anything the target language cannot already read: CJK
 * when the target is English, Latin letters when the target is Chinese.
 *
 * It is still required: it guards the unchanged-text check below, because DeepL
 * also echoes back chunks that have nothing to translate (markup, numbers, text
 * already in the target language). Without it those would burn an allowed retry
 * and then make a pointless fallback request, so a page of markup could be sent
 * to DLX for nothing.
 */
const expectsTranslation = (chunk: string, target: TargetLanguage): boolean =>
  /ZH/.test(target) ? /[A-Za-z]/.test(chunk) : /[\u3400-\u9fff]/.test(chunk)

/**
 * The provider status carried by a `@deeplx/core` failure. Its `translate()`
 * throws `new Error(message, { cause: { code, message } })`, where `code` is the
 * DeepL response status, or 503 for a failure the library itself normalises
 * (network error, abort, empty translation response). Measured against 0.2.3: a
 * rejected `target_lang` gives `cause.code === 400`, an aborted request gives
 * `cause.code === 503`. Only a numeric `cause.code` is trusted, so any other
 * error shape counts as having no status.
 */
const statusOf = (error: unknown): number | undefined => {
  const code = (error as { cause?: { code?: unknown } } | null)?.cause?.code
  return typeof code === 'number' ? code : undefined
}

/**
 * A 4xx means DeepL rejected this request or client profile, so repeating it is
 * pointless: the chunk goes to the self-hosted DLX (a different client profile)
 * right away. Everything else -- 5xx, timeouts, aborts, network failures and
 * anything unrecognised -- may be transient and consumes the remaining attempts.
 */
const isRetryableError = (error: unknown): boolean => {
  const status = statusOf(error)
  return status === undefined || status < 400 || status >= 500
}

/**
 * One primary attempt through `@deeplx/core`, which talks to DeepL's anonymous
 * oneshot endpoint. Throws on provider errors (timeout, rate limit, ...).
 */
const translateWithLibrary = (
  chunk: string,
  target: TargetLanguage,
  source: SourceLanguage,
): Promise<string> =>
  translate(chunk, target, source, {
    signal: AbortSignal.timeout(CHUNK_TIMEOUT),
  })

/**
 * One fallback request to the self-hosted DLX service. The origin (host, port
 * and any path prefix) comes from `DEEPLX_URL` verbatim and only `/translate`
 * is appended, so nothing here is host or port specific.
 *
 * Redirects are followed (the runtime default), so an endpoint that redirects
 * `http` -> `https` or sits behind a path prefix keeps working. That is not a
 * credential leak: the bearer token already goes to the configured origin on the
 * first request, so a hostile or compromised endpoint could read it anyway.
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
  source: SourceLanguage,
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
  source: SourceLanguage,
  attempts: number,
  service: DlxService,
): Promise<{ text: string; ok: boolean }> => {
  // primary: the `@deeplx/core` library, up to `attempts` tries
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const text = await translateWithLibrary(chunk, target, source)

      if (text === chunk && expectsTranslation(chunk, target)) {
        // DeepL answers 200 with the input text, without an error, when it declines
        // to translate. Count it as a failed attempt so an allowed retry still runs,
        // and fall back to the source text once the attempts are exhausted. An
        // identical result is legitimate for chunks that carry nothing to translate
        // (markup, names, text already in the target language), so those pass through.
        console.warn(
          '[translate] library returned the source text unchanged',
          `attempt=${attempt}/${attempts}`,
          `length=${chunk.length}`,
          `source=${source} target=${target}`,
          JSON.stringify(chunk.slice(0, 80)),
        )
        continue
      }

      return { text, ok: true }
    } catch (error) {
      // shows up in the Worker logs (observability is enabled in wrangler.jsonc)
      console.warn(
        `[translate] library chunk failed (attempt ${attempt}/${attempts})`,
        String(error),
        `length=${chunk.length}`,
      )

      if (!isRetryableError(error)) {
        // 4xx: DeepL rejected this request/profile, so a repeated call would be
        // rejected the same way; stop retrying and let the fallback try instead
        console.warn(
          '[translate] library rejected the request (4xx), not retrying',
          `status=${statusOf(error)}`,
          `length=${chunk.length}`,
        )
        break
      }
    }
  }

  // fallback: a single self-hosted DLX request, and only when it is configured.
  // It is lazy on purpose: a chunk the library translated never reaches it, so
  // the public service stays out of the hot path while it is being validated.
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
