import {
  IOS_APP_BUILD,
  IOS_APP_VERSION,
  IOS_CFNETWORK_VERSION,
  IOS_DARWIN_VERSION,
  IOS_OS_VERSION,
  MAX_FREE_TEXT_LENGTH,
  ONESHOT_FREE_ENDPOINT,
  getSharedCookies,
  translateByDeepLX,
} from '@deeplx/core'
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
 *
 * Only prose is ever sent: `<pre>` blocks are lifted out of the body and spliced
 * back byte-for-byte, and the prose is split into block-level units (paragraphs,
 * list items, headings, table cells) that are translated one by one, so a provider
 * sees a whole paragraph rather than an arbitrary slice of one. Inline `<code>`
 * inside a unit is masked with a numbered token -- it is never sent either -- and
 * the original span is spliced back on return; when a token is not preserved the
 * unit falls back to translating its prose fragments separately. A unit whose
 * answer still shares a meaningful run of source prose is retried once through a
 * batched DLX request and, if that does not improve it, is reported as
 * `remaining` instead of as translated. A unit that comes back unchanged --
 * compared with markup, code and whitespace removed, and with the provider's own
 * `sourceLang`/`source_lang` taken into account when it says the source already is
 * the target language -- keeps its source text and is counted in `failedChunks`.
 * No signal in this file depends on a particular language or script.
 */
const DEEPL_LOCALES: Record<Locale, string> = {
  [Locale.EN]: 'EN',
  [Locale.ZH]: 'ZH',
}

/** The provider rejects anything longer than its anonymous oneshot limit, so the
 * splitting cap is that limit itself rather than a copy of the number. */
const MAX_CHARS = MAX_FREE_TEXT_LENGTH
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
 * source text is kept for a minute only, so a transient provider outage cannot
 * stick: the next render after that minute tries again, and a client retry is
 * never answered with the cached failure at all.
 */
const CACHE_TTL = 60 * 60 * 24
const CACHE_FAILURE_TTL = 60
/**
 * Bumped whenever an entry written by an older build must not be served any
 * more. It is part of the key, so the entries the previous build stored for a
 * day — including one whose "translation" was an echo with a whitespace tweak —
 * are simply never read again instead of having to expire.
 */
const CACHE_VERSION = 2
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
  /** how many chunks had to keep their source text; for observability only */
  failedChunks?: number
  /** units the subrequest budget did not reach; a follow-up request finishes them */
  remaining?: number
  /** provider subrequests this request spent, for observability */
  subrequests?: number
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

/**
 * The part of a chunk a translation is supposed to change: markup, code blocks
 * and whitespace removed. The anonymous endpoint has been observed answering
 * with the source unchanged apart from a single space it inserted inside a
 * `<code>` block, so "did anything change?" cannot be a byte comparison — that
 * answer was accepted as a translation and cached for a day, which is how an
 * article body stayed Chinese while its title was translated.
 *
 * Nothing here knows about a language: it only removes markup and whitespace.
 */
const visibleText = (value: string): string =>
  value
    .replace(/<(?:pre|code)\b[\s\S]*?<\/(?:pre|code)>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * `EN`, `en-US`, `ZH-Hans` … all name one language for this comparison, which is
 * only ever used to compare two language tags with each other. No script or
 * Unicode range is involved, so the rule works for any pair of languages.
 */
const languageOf = (value?: string): string | undefined =>
  value?.trim().toLowerCase().split(/[-_]/)[0] || undefined

/**
 * Whether a provider answer should be treated as *not a translation*, using
 * language-agnostic signals only:
 *
 * - the answer equals the source once markup, `<pre>`/`<code>` content and
 *   whitespace are removed: an unchanged answer is never a translation;
 * - unless the provider itself reports that the source already is the requested
 *   target language (`sourceLang` from the library, `source_lang` from the DLX).
 *   Then there was nothing to translate and the identical answer is the expected
 *   one — it is accepted, just not reported as a translation.
 *
 * Without a detected language the first signal decides on its own.
 */
const isUntranslated = (
  chunk: string,
  answer: string,
  target: TargetLanguage,
  detected?: string,
): boolean => {
  const sourceText = visibleText(chunk)

  // nothing but markup and code: there is no prose to translate
  if (!sourceText) {
    return false
  }

  if (sourceText !== visibleText(answer)) {
    return false
  }

  return languageOf(detected) !== languageOf(target)
}

/**
 * The detected language is only usable when it agrees with the source the caller
 * asserted. The anonymous endpoint reports the *requested target* as its detected
 * language whenever its own detection is not confident — measured: the Chinese
 * bodies of 80, 105 and 421 and the Chinese prose of 323 all come back as
 * `sourceLang: "EN"` for `target=EN`, and even a single ` 对 ` unit comes back
 * byte-identical with `sourceLang: "EN"` — so a detection that contradicts the
 * caller is discarded and rule (1) decides alone. A detection that agrees is
 * meaningful: `source=en, target=en` with `detected=EN` really is "nothing to
 * translate", while `source=zh, target=en` with `detected=EN` is the provider
 * echoing the text.
 */
const detectedFor = (
  reported: string | undefined,
  source: SourceLanguage | undefined,
): string | undefined =>
  source && languageOf(reported) === languageOf(source) ? reported : undefined

/**
 * Whether an answer that is unchanged in prose is still the correct one: the
 * provider says the source already is the target language, so there was nothing
 * to translate. Everything else that reached this point is an echo.
 */
const isAlreadyTarget = (
  chunk: string,
  answer: string,
  target: TargetLanguage,
  detected?: string,
): boolean => {
  const sourceText = visibleText(chunk)

  return Boolean(
    sourceText &&
      sourceText === visibleText(answer) &&
      languageOf(detected) === languageOf(target),
  )
}

/** Self-hosted DLX. Both env vars are optional: `DEEPLX_URL` alone already
 * enables the fallback, and no `authorization` header is sent without a token. */
interface DlxService {
  url?: string
  token?: string
}

/** A body split into what a translator may see and what it may not. */
interface Segment {
  /** a `<pre>` span, spliced back byte-for-byte */
  code: boolean
  text: string
}

/** One piece of a block: prose to send, or code passed through untouched. */
interface UnitPiece {
  text: string
  /** code: never sent to a provider, always spliced back byte-for-byte */
  fixed?: boolean
}

/** What one piece's translation produced: the text plus how it came back. */
interface PieceResult {
  text: string
  /** false when nothing translated the piece and it kept its source text */
  ok: boolean
  /** true only when a provider actually changed the prose */
  translated: boolean
}

/** One block-level unit of prose, and the pieces it is actually sent as. */
interface ProseUnit {
  text: string
  /** the pieces of the pass that is running; empty when nothing is translatable */
  pieces: UnitPiece[]
  /** every inline `<code>` span a token stands for, in order */
  codeSpans: string[]
  /** what each piece came back as, position-aligned with `pieces` */
  answers: Array<PieceResult | undefined>
  /** the per-fragment attempt, kept in case a token does not survive */
  fragments?: UnitPiece[]
  /** the unit's final text; `undefined` means the masked attempt is unusable */
  result?: string
  /** true when a source-prose run survived every attempt */
  suspect?: boolean
}

/**
 * `<pre>` is a hard segment: a block of code is passed through verbatim and is
 * never sent to a provider. Inline `<code>` is deliberately **not** a segment
 * boundary -- the block around it stays one unit, and every inline span is masked
 * with a short token instead, so a provider is asked to translate a whole
 * paragraph and the code is spliced back byte-for-byte afterwards.
 */
const CODE_SPAN = /<pre\b[^>]*>[\s\S]*?<\/pre>/gi

/** Inline code inside a block: masked with a token rather than split on. */
const INLINE_CODE = /<code\b[^>]*>[\s\S]*?<\/code>/gi

/**
 * The placeholder that stands in for the `index`-th inline code span. Braces and
 * digits carry no `\p{Po}`, no whitespace and no `>`, so the over-cap splitter can
 * never cut one in half, and there is no word inside for a provider to translate.
 * Measured against the anonymous endpoint, `{{0}}` and `{{1}}` come back in place,
 * in order; when a provider does not preserve them the unit falls back to its own
 * prose fragments, so a mangled token can never corrupt the body.
 */
const codeToken = (index: number): string => `{{${index}}}`

const CODE_TOKEN = /\{\{(\d+)\}\}/g

/** Text a provider could actually change: markup, code tokens and entities out. */
const hasProse = (value: string): boolean =>
  /\p{L}/u.test(
    value
      .replace(/<[^>]*>/g, ' ')
      .replace(CODE_TOKEN, ' ')
      .replace(/&[a-z#0-9]{1,31};/gi, ' '),
  )

/**
 * Splits a body into ordered prose and code segments. Code is never sent to a
 * provider -- it is spliced back exactly as it arrived -- so an identifier,
 * a regex or a shell snippet cannot be rewritten. Inline code is left in its
 * block and masked per unit instead, so a paragraph still travels as one piece.
 */
const splitSegments = (text: string): Segment[] => {
  const segments: Segment[] = []
  let last = 0

  for (const match of text.matchAll(CODE_SPAN)) {
    if (match.index > last) {
      segments.push({ code: false, text: text.slice(last, match.index) })
    }
    segments.push({ code: true, text: match[0] })
    last = match.index + match[0].length
  }

  if (last < text.length) {
    segments.push({ code: false, text: text.slice(last) })
  }

  return segments
}

/** DLX answers `{ code, data, source_lang, ... }`: `data` is the translation. */
interface DlxResponse {
  code?: number
  data?: unknown
  /** the language the DLX detected for the text it was sent */
  source_lang?: string
  message?: string
}

/** Closers of the prose blocks an article is made of. A unit ends after one of
 * them, so a unit is a whole paragraph, list item, heading or table cell. */
const BLOCK_CLOSE =
  /<\/(?:p|li|h[1-6]|blockquote|td|th|dt|dd|figcaption|caption|summary)\s*>/gi

/**
 * Splits prose (code already lifted out) into block-level units, keeping their
 * tags: a `<p>`, `<li>`, heading, blockquote or table cell is one unit, so the
 * provider is asked to translate complete paragraphs rather than 1500-character
 * slices. Because every unit carries its own markup, reassembly is a plain
 * concatenation in the original order.
 */
const splitBlocks = (text: string): string[] => {
  const blocks: string[] = []
  let last = 0

  for (const match of text.matchAll(BLOCK_CLOSE)) {
    const end = match.index + match[0].length

    if (end > last) {
      blocks.push(text.slice(last, end))
      last = end
    }
  }

  if (last < text.length) {
    blocks.push(text.slice(last))
  }

  return blocks
}

/**
 * The end of a clause: any final punctuation, in whatever script, so an
 * oversized block is cut at a clause boundary. A Unicode general category is
 * used rather than a list of characters, so nothing here is tied to a language
 * (and prose that has no spaces still gets a boundary).
 */
const CLAUSE_END = /\p{Po}/gu

/** The offset just after the last clause end of `window`, or -1 when it has none. */
const lastClauseCut = (window: string): number => {
  let cut = -1

  for (const match of window.matchAll(CLAUSE_END)) {
    cut = match.index + match[0].length
  }

  return cut
}

/**
 * Offsets at which a cut would split a tag, an HTML entity or a code token, and
 * so corrupt the markup. `splitText` keeps `text.slice(0, cut)` on the left, so a
 * cut just *after* a closed tag or entity is safe while any offset inside one is
 * not. `&`, `;`, `"`, `'`, `/`, `:`, `.`, `#` and `%` are all `\p{Po}` or
 * separators, so without this a cut could land in the middle of `<a href="…">` or
 * `&amp;` -- measured before this guard.
 */
const unsafeCuts = (window: string): boolean[] => {
  const unsafe = new Array<boolean>(window.length + 1).fill(false)

  const mark = (from: number, to: number) => {
    for (let index = Math.max(from, 0); index <= to && index < unsafe.length; index++) {
      unsafe[index] = true
    }
  }

  // a tag, from just after `<` through its closing `>`; an unterminated tag runs
  // to the end of the window
  for (const match of window.matchAll(/<[^>]*>?/g)) {
    mark(match.index + 1, match.index + match[0].length - 1)
  }

  // an entity, from just after `&` through its `;`
  for (const match of window.matchAll(/&[a-z#0-9]{1,31};/gi)) {
    mark(match.index + 1, match.index + match[0].length - 1)
  }

  // a code token, from just after `{` through its `}`
  for (const match of window.matchAll(CODE_TOKEN)) {
    mark(match.index + 1, match.index + match[0].length - 1)
  }

  // a tag or an entity that opens inside the window but only closes beyond the
  // cap: the window cannot see its `>`/`;`, so everything after the opener is
  // unsafe and the cut moves back to before it
  const lastOpen = window.lastIndexOf('<')
  if (lastOpen > window.lastIndexOf('>')) {
    mark(lastOpen + 1, window.length)
  }

  const lastAmp = window.lastIndexOf('&')
  if (lastAmp > window.lastIndexOf(';')) {
    mark(lastAmp + 1, window.length)
  }

  return unsafe
}

/**
 * Splits a block that exceeds the provider's per-request limit at a sentence,
 * newline, tag or space boundary, and only where the cut cannot land inside a
 * tag, an entity or a token. Re-joining the pieces therefore restores every
 * attribute and entity byte-for-byte.
 */
const splitText = (text: string, size = MAX_CHARS): string[] => {
  if ([...text].length <= size) {
    return [text]
  }

  const chunks: string[] = []
  let rest = text

  while ([...rest].length > size) {
    const window = [...rest].slice(0, size).join('')
    const unsafe = unsafeCuts(window)
    // every candidate is already an exclusive end offset
    let cut = -1

    for (const candidate of [
      lastClauseCut(window),
      window.lastIndexOf('\n') + 1,
      window.lastIndexOf('>') + 1,
      window.lastIndexOf(' ') + 1,
    ]) {
      if (candidate > cut && candidate <= window.length && !unsafe[candidate]) {
        cut = candidate
      }
    }

    if (cut <= 0) {
      // no boundary is usable: take the furthest safe offset instead, which still
      // keeps every tag and entity whole
      for (let index = window.length; index > 0; index--) {
        if (!unsafe[index]) {
          cut = index
          break
        }
      }
    }

    if (cut <= 0) {
      // the whole window is one tag, entity or token: cutting would corrupt it,
      // so the block is left whole and the provider's own cap decides
      return [text]
    }

    chunks.push(rest.slice(0, cut))
    rest = rest.slice(cut)
  }

  if (rest) {
    chunks.push(rest)
  }

  return chunks
}

/** Masks every inline `<code>` span of a block with a numbered token. */
const maskCode = (block: string): { masked: string; codeSpans: string[] } => {
  const codeSpans: string[] = []

  const masked = block.replace(INLINE_CODE, match => {
    codeSpans.push(match)
    return codeToken(codeSpans.length - 1)
  })

  return { masked, codeSpans }
}

/**
 * The pieces of a block once inline code is separated out again: the fallback for
 * a unit whose tokens did not survive, where each prose fragment is sent on its
 * own -- the behaviour before tokens existed -- and every code span is fixed.
 */
const fragmentPieces = (block: string): UnitPiece[] => {
  const pieces: UnitPiece[] = []
  let last = 0

  for (const match of block.matchAll(INLINE_CODE)) {
    if (match.index > last) {
      for (const piece of splitText(block.slice(last, match.index))) {
        pieces.push({ text: piece })
      }
    }
    pieces.push({ text: match[0], fixed: true })
    last = match.index + match[0].length
  }

  if (last < block.length) {
    for (const piece of splitText(block.slice(last))) {
      pieces.push({ text: piece })
    }
  }

  return pieces
}

/** Builds one block-level unit: inline code is masked with tokens, not split on. */
const makeUnit = (block: string): ProseUnit => {
  const { masked, codeSpans } = maskCode(block)
  const unit: ProseUnit = { text: block, pieces: [], codeSpans, answers: [] }

  // only markup, code or entities: there is no prose to send
  if (!hasProse(masked)) {
    return unit
  }

  unit.pieces = splitText(masked).map(text => ({ text }))
  unit.answers = new Array<PieceResult | undefined>(unit.pieces.length)

  if (codeSpans.length) {
    unit.fragments = fragmentPieces(block)
  }

  return unit
}

/**
 * Slices the code spans back in. Every token has to appear exactly once and in
 * order: a missing, duplicated, reordered or invented token means the provider
 * did not preserve the placeholders, the answer is unusable, and the caller falls
 * back to translating the block's prose fragments separately.
 */
const unmask = (answer: string, codeSpans: string[]): string | undefined => {
  const matches = [...answer.matchAll(CODE_TOKEN)]

  if (matches.length !== codeSpans.length) {
    return undefined
  }

  for (let index = 0; index < matches.length; index++) {
    const match = matches[index]

    if (!match || Number(match[1]) !== index) {
      return undefined
    }
  }

  let result = answer

  for (let index = matches.length - 1; index >= 0; index--) {
    const match = matches[index]
    const code = codeSpans[index]

    if (!match || code === undefined) {
      return undefined
    }

    const at = match.index ?? 0
    result = result.slice(0, at) + code + result.slice(at + match[0].length)
  }

  return result
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
 * is 200 and `data` is a non-empty string that actually translated the chunk;
 * anything else (429, an auth failure whose body may not even be JSON, an empty
 * payload or an answer that is still the source, markup noise aside) throws. The
 * token is never logged.
 */
const translateWithDlx = async (
  chunk: string,
  target: TargetLanguage,
  source: SourceLanguage | undefined,
  service: DlxService,
  label: string,
): Promise<{ text: string; detected?: string }> => {
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
      label,
      `status=${response.status}`,
      `length=${chunk.length}`,
    )
    throw new Error(`DLX responded with HTTP ${response.status}`)
  }

  // ofetch parses the body into `_data` (destr, so a non-JSON body stays a string)
  const payload: DlxResponse | undefined = response._data
  const { code, data, source_lang: reported } = payload ?? {}

  const detected = detectedFor(reported, source)

  if (code !== 200 || typeof data !== 'string' || !data) {
    throw new Error(`DLX responded with HTTP 200, code ${code}`)
  }

  if (isUntranslated(chunk, data, target, detected)) {
    console.warn(
      '[translate] DLX did not translate the chunk',
      label,
      `length=${chunk.length}`,
      `source=${source ?? 'auto'} target=${target}`,
      `detected=${reported ?? 'none'}`,
    )
    throw new Error('DLX did not translate the chunk')
  }

  return { text: data, detected }
}

/**
 * One batched request to the self-hosted DLX: an array of texts in, one answer
 * per input out, in order. It is used only to re-ask for the units whose first
 * answer still looked partly translated. The endpoint answers `data` as an array
 * for an array input; anything else (a non-200, a `code` other than 200, a
 * mismatched length or a non-string entry) makes that position unusable and the
 * caller keeps what it already had. The token is never logged or sent anywhere but
 * the configured origin.
 */
const translateBatchWithDlx = async (
  texts: string[],
  target: TargetLanguage,
  source: SourceLanguage | undefined,
  service: DlxService,
): Promise<Array<string | undefined>> => {
  const url = service.url

  if (!url) {
    return texts.map(() => undefined)
  }

  try {
    const response = await $fetch.raw<DlxResponse>(`${url}${DEEPLX_PATH}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(service.token && { authorization: `Bearer ${service.token}` }),
      },
      body: {
        text: texts,
        // omitted for auto-detection: JSON.stringify drops an undefined value
        source_lang: source,
        target_lang: target,
      },
      redirect: 'follow',
      ignoreResponseError: true,
      signal: AbortSignal.timeout(FALLBACK_TIMEOUT),
    })

    if (response.status !== 200) {
      console.warn(
        '[translate] DLX batch answered with a non-200 status',
        `status=${response.status}`,
        `texts=${texts.length}`,
      )
      return texts.map(() => undefined)
    }

    const payload: DlxResponse | undefined = response._data
    const data = payload?.data

    if (payload?.code !== 200 || !Array.isArray(data) || data.length !== texts.length) {
      console.warn(
        '[translate] DLX batch did not line up',
        `texts=${texts.length}`,
        `data=${Array.isArray(data) ? data.length : typeof data}`,
      )
      return texts.map(() => undefined)
    }

    return data.map(value =>
      typeof value === 'string' && value ? value : undefined,
    )
  } catch (error) {
    console.warn('[translate] DLX batch threw', String(error), `texts=${texts.length}`)
    return texts.map(() => undefined)
  }
}

/** What one unit's translation produced: the text plus how it came back. */
interface ChunkResult {
  text: string
  /** false when nothing translated the unit and it kept its source text */
  ok: boolean
  /** true only when a provider actually changed the prose */
  translated: boolean
}

/** One chunk of one request: the chunk itself plus everything the logs need. */
interface ChunkTask {
  chunk: string
  index: number
  total: number
  target: TargetLanguage
  source: SourceLanguage | undefined
  attempts: number
  service: DlxService
  /** the batch path already asked the library, so only the fallback is left */
  skipLibrary?: boolean
}

const translateChunk = async ({
  chunk,
  index,
  total,
  target,
  source,
  attempts,
  service,
  skipLibrary,
}: ChunkTask): Promise<ChunkResult> => {
  // every log line names the chunk, so a partly translated body can be traced to
  // the chunks that failed instead of being invisible
  const label = `chunk=${index + 1}/${total}`

  // primary: the `@deeplx/core` library, up to `attempts` tries. It reports its
  // outcome as a value, so the retry decision is a plain check on `code`
  for (let attempt = 1; !skipLibrary && attempt <= attempts; attempt++) {
    try {
      const result = await translateWithLibrary(chunk, target, source)

      // a 200 with a non-empty string is a real response
      if (
        result.code === 200 &&
        'data' in result &&
        typeof result.data === 'string' &&
        result.data
      ) {
        const detected = detectedFor(
          'sourceLang' in result ? (result.sourceLang as string) : undefined,
          source,
        )

        // the provider says the source already is the target language: the
        // identical answer is the expected one, accepted but not a translation
        if (isAlreadyTarget(chunk, result.data, target, detected)) {
          console.warn(
            '[translate] source already is the target language',
            label,
            `detected=${detected ?? 'none'}`,
            `target=${target}`,
            `length=${chunk.length}`,
          )
          return { text: result.data, ok: true, translated: false }
        }

        if (isUntranslated(chunk, result.data, target, detected)) {
          // The library's anonymous profile echoes short, ambiguous or mixed
          // chunks unchanged (it also mirrors the requested `source_lang` as
          // `detected_source_language` when its detection is not confident), so
          // retrying it with the same profile is pointless. The self-hosted DLX
          // answers with a different client profile -- the iOS one -- which is the
          // path that can still translate such a chunk, so stop retrying here and
          // let the fallback try it once below.
          console.warn(
            '[translate] library did not translate the chunk, falling back',
            label,
            `attempt=${attempt}/${attempts}`,
            `length=${chunk.length}`,
            `source=${source ?? 'auto'} target=${target}`,
            `detected=${detected ?? 'none'}`,
          )
          break
        }

        return { text: result.data, ok: true, translated: true }
      }

      // no usable response: log it (observability is enabled in wrangler.jsonc)
      // and decide whether another attempt is worth it
      console.warn(
        `[translate] library chunk failed (attempt ${attempt}/${attempts})`,
        label,
        `code=${result.code}`,
        `message=${'message' in result ? result.message : 'none'}`,
        `length=${chunk.length}`,
      )

      if (result.code >= 400 && result.code < 500) {
        // 4xx: DeepL rejected this request/profile, so a repeated call would be
        // rejected the same way; stop retrying and let the fallback try instead
        console.warn(
          '[translate] library rejected the request (4xx), not retrying',
          label,
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
        label,
        String(error),
        `length=${chunk.length}`,
      )
    }
  }

  // fallback: one self-hosted DLX request, and only when it is configured. It runs
  // when the library really failed (a 4xx above, or a 5xx/unusable result that used
  // up the attempts) or did not translate the chunk; a translated chunk never
  // reaches it, and without `DEEPLX_URL` the chunk simply keeps its source text.
  if (service.url) {
    console.warn(
      '[translate] falling back to the self-hosted DLX',
      label,
      `attempts=${attempts}`,
      `length=${chunk.length}`,
      `source=${source ?? 'auto'} target=${target}`,
    )

    try {
      const dlx = await translateWithDlx(chunk, target, source, service, label)

      return {
        text: dlx.text,
        ok: true,
        // the DLX can also answer that the source already is the target language
        translated: !isAlreadyTarget(chunk, dlx.text, target, dlx.detected),
      }
    } catch (error) {
      console.warn(
        '[translate] DLX fallback failed',
        label,
        String(error),
        `length=${chunk.length}`,
      )
    }
  }

  console.warn(
    '[translate] chunk kept its source text',
    label,
    `length=${chunk.length}`,
    `target=${target}`,
  )

  return { text: chunk, ok: false, translated: false }
}

/**
 * Every chunk is at least one subrequest. Measured, a normal article body is
 * 1-5 chunks (2-6 subrequests, all of which complete), and a synthetic
 * 15.6k-character body was 11 chunks: the runtime already queued those to the
 * same origin (a peak of 2 in flight, identical with and without this bound), so
 * the chunk count is not what broke a body. The bound is a cap rather than a
 * fix: it matches the runtime's simultaneous-connection budget, so a pathological
 * body cannot fire an unbounded number of them at once, while a normal article
 * (at most 6 chunks) still runs in one round.
 */
const CHUNK_CONCURRENCY = 6

/**
 * The oneshot endpoint takes an **array** of texts and answers with one
 * translation per input, in order, so a batch is a single subrequest however many
 * units it carries. `@deeplx/core` only exposes a single-text helper, so the
 * batch request is built here from the constants the library itself uses; the
 * helper stays the fallback for a single unit.
 */
const BATCH_MAX_TEXTS = 16
/** A sensible ceiling for one request body, on top of the per-text limit. */
const BATCH_MAX_CHARS = 8000
/**
 * How many provider subrequests one request may spend, the cookie warm-up
 * included. The Workers free plan caps subrequests per request at 50, and a render
 * also talks to the GitHub API, so 16 leaves a wide margin (34 of the 50 stay for
 * the GitHub calls and the rest of the request). Every outbound call reserves its
 * slot *before* it starts, so a batch and its fallbacks can never push the total
 * over this cap; whatever is left over keeps its source text, is reported as
 * `remaining`, and a follow-up request picks it up -- the unit cache below means
 * that follow-up only pays for the units still missing.
 */
const MAX_SUBREQUESTS = 16

/** One unit waiting to be translated, with the batch it belongs to. */
interface BatchJob {
  index: number
  text: string
}

/** One piece waiting for a provider, addressed inside the plan. */
interface UnitTask {
  unit: ProseUnit
  piece: number
  text: string
}

/** A segment of the plan: code passes through, prose carries its units. */
interface PlanSegment {
  code: boolean
  text: string
  units: ProseUnit[]
}

interface OneshotTranslation {
  text?: string
  detected_source_language?: string
}

interface OneshotResponse {
  translations?: OneshotTranslation[]
}

const instanceId = crypto.randomUUID()
const sessionId = crypto.randomUUID()

/** The warm-up's outcome: the cookies it obtained and whether it fetched at all. */
interface WarmResult {
  cookies?: string
  fetched: boolean
}

let warmCookies: string | undefined
/** The one in-flight warm-up, shared by every caller that races into it. */
let warmPromise: Promise<WarmResult> | undefined

/**
 * The actual warm-up request, exactly like the library does. It only runs when
 * neither this isolate's cookies nor the library's own are already known.
 */
const doWarmOneshot = async (): Promise<WarmResult> => {
  if (warmCookies !== undefined || getSharedCookies()) {
    return {
      cookies: warmCookies ?? getSharedCookies() ?? undefined,
      fetched: false,
    }
  }

  const response = await fetch('https://www.deepl.com/translator', {
    signal: AbortSignal.timeout(FALLBACK_TIMEOUT),
  })
  // `Set-Cookie` is a forbidden response-header name, so `get('set-cookie')` is
  // only a compatibility fallback: `getSetCookie()` is the accessor the current
  // spec requires (workerd gates it behind a flag while `get()` happens to return
  // the joined value), so prefer it whenever the runtime provides it.
  const setCookie =
    response.headers.getSetCookie?.().join('; ') ??
    response.headers.get('set-cookie') ??
    ''
  const cookies = [
    /userCountry=[^;]+/.exec(setCookie)?.[0],
    /verifiedBot=[^;]+/.exec(setCookie)?.[0],
  ].filter(Boolean)

  warmCookies = cookies.length ? cookies.join('; ') : ''
  return { cookies: warmCookies || undefined, fetched: true }
}

/**
 * One best-effort warm-up per isolate, exactly like the library does. Concurrent
 * callers share a single in-flight promise, so a cold isolate makes one request
 * however many renders race into it; the resolved cookies are cached, so a later
 * call makes no request at all. It reports whether *this* call made the request,
 * so the caller can count that subrequest against its budget.
 *
 * A rejected warm-up is not fatal: the caller gets no cookies and no throw, and
 * the in-flight promise is cleared so the next call can try again instead of
 * being stuck with a permanently rejected promise.
 */
const warmOneshot = (): Promise<WarmResult> => {
  if (warmCookies !== undefined || getSharedCookies()) {
    return Promise.resolve({
      cookies: warmCookies ?? getSharedCookies() ?? undefined,
      fetched: false,
    })
  }

  warmPromise ??= doWarmOneshot().catch(error => {
    console.warn('[translate] warm-up failed', String(error))
    warmPromise = undefined
    return { cookies: undefined, fetched: true }
  })

  return warmPromise
}

/**
 * Translates a batch of units in one request. Every answer is returned position
 * by position, so the caller can still tell which unit failed; a status other
 * than 200, or a response whose `translations` do not line up with the input,
 * fails the whole batch and sends each unit to the fallback. The cookies come from
 * a warm-up the caller already counted, so this never warms up on its own.
 */
const translateBatchWithLibrary = async (
  texts: string[],
  target: TargetLanguage,
  source: SourceLanguage | undefined,
  cookies?: string,
): Promise<(OneshotAnswer | undefined)[]> => {
  const response = await fetch(ONESHOT_FREE_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      authorization: 'None',
      'user-agent': `DeepL/${IOS_APP_VERSION} CFNetwork/${IOS_CFNETWORK_VERSION} Darwin/${IOS_DARWIN_VERSION}`,
      'x-app-os-version': IOS_OS_VERSION,
      'x-app-instance-id': instanceId,
      'x-app-session-id': sessionId,
      ...(cookies ? { cookie: cookies } : {}),
    },
    body: JSON.stringify({
      text: texts,
      target_lang: target,
      // JSON drops an undefined source, which is what auto-detection wants
      source_lang: source,
      usage_type: 'translate',
      app_information: {
        os: 'iOS',
        os_version: IOS_OS_VERSION,
        app_version: IOS_APP_VERSION,
        app_build: IOS_APP_BUILD,
        instance_id: instanceId,
      },
    }),
    signal: AbortSignal.timeout(CHUNK_TIMEOUT),
  })

  if (response.status !== 200) {
    console.warn(
      '[translate] batch request failed',
      `status=${response.status}`,
      `texts=${texts.length}`,
    )
    return texts.map(() => undefined)
  }

  const payload = (await response.json().catch(() => null)) as
    | OneshotResponse
    | null
  const translations = payload?.translations

  if (!Array.isArray(translations) || translations.length !== texts.length) {
    console.warn(
      '[translate] batch response did not line up',
      `texts=${texts.length}`,
      `translations=${Array.isArray(translations) ? translations.length : 'none'}`,
    )
    return texts.map(() => undefined)
  }

  return translations.map(translation =>
    typeof translation?.text === 'string' && translation.text
      ? {
          data: translation.text,
          sourceLang: translation.detected_source_language,
        }
      : undefined,
  )
}

/**
 * Runs the batches a few at a time: each batch is one subrequest, and the runtime
 * caps how many connections may be in flight at once.
 */
const mapConcurrent = async <Item, Result>(
  items: Item[],
  limit: number,
  task: (item: Item, index: number) => Promise<Result>,
): Promise<Result[]> => {
  const results = new Array<Result>(items.length)
  // one shared iterator: next() is synchronous, so two workers never take the
  // same item
  const queue = items.entries()

  const worker = async () => {
    for (const [index, item] of queue) {
      results[index] = await task(item, index)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  )

  return results
}

/** One unit's raw answer, whoever produced it. */
interface OneshotAnswer {
  data: string
  sourceLang?: string
}

/**
 * Groups units into requests: at most `BATCH_MAX_TEXTS` texts and
 * `BATCH_MAX_CHARS` characters each, so a batch never has to be split at the
 * provider and every text stays inside the per-text limit on its own.
 */
const batchUnits = (jobs: BatchJob[]): BatchJob[][] => {
  const batches: BatchJob[][] = []
  let batch: BatchJob[] = []
  let chars = 0

  for (const job of jobs) {
    if (
      batch.length &&
      (batch.length >= BATCH_MAX_TEXTS || chars + job.text.length > BATCH_MAX_CHARS)
    ) {
      batches.push(batch)
      batch = []
      chars = 0
    }

    batch.push(job)
    chars += job.text.length
  }

  if (batch.length) {
    batches.push(batch)
  }

  return batches
}

/** The smallest shared run that counts as source prose a translation left behind. */
const SHARED_RUN = 12
/** The share of the answer that has to be such prose before the unit is a suspect. */
const SHARED_SHARE = 0.3
/** A run this much covered by verbatim terms is a kept identifier, not prose. */
const KEEP_FRACTION = 0.5

/**
 * The shape of something a translation legitimately keeps verbatim: a digit, a
 * URL/identifier separator, an inner case change (`devDependency`) or an acronym.
 * This is shape only -- no script and no language is named -- so the same rule
 * discounts a package name, a URL or an acronym on either side. The trailing `.`
 * and `,` cover a repeated fragment (`reload, reload…`) that is already in the
 * answer's own language.
 */
const VERBATIM =
  /[\p{N}@/:#_\-~+=%?&.,]|[\p{Ll}][\p{Lu}]|[\p{Lu}][\p{Ll}]|^[\p{Lu}\p{N}]{2,}$/u

/** The words of `source` a translation may keep as they are, longest first. */
const verbatimTerms = (source: string): string[] => {
  const terms = new Set<string>()

  // markup, attributes included, is never prose
  for (const match of source.matchAll(/<[^>]+>/g)) {
    terms.add(match[0])
  }

  for (const match of visibleText(source).matchAll(/\S+/g)) {
    if (VERBATIM.test(match[0])) {
      terms.add(match[0])
    }
  }

  return [...terms].sort((left, right) => right.length - left.length)
}

/** Marks every character of `text` that falls inside one of `terms`. */
const verbatimMask = (text: string, terms: string[]): boolean[] => {
  const mask = new Array<boolean>(text.length).fill(false)

  for (const term of terms) {
    let from = 0

    for (;;) {
      const at = text.indexOf(term, from)

      if (at === -1) {
        break
      }

      for (let index = at; index < at + term.length; index++) {
        mask[index] = true
      }

      from = at + term.length
    }
  }

  return mask
}

/**
 * The maximal runs of `answer` that also occur in `source`, in order. A run can
 * only start where a `SHARED_RUN`-gram already exists, so the common case costs
 * one set lookup per offset.
 */
const sharedRuns = (answer: string, source: string): Array<[number, number]> => {
  const openers = new Set<string>()

  for (let index = 0; index + SHARED_RUN <= source.length; index++) {
    openers.add(source.slice(index, index + SHARED_RUN))
  }

  const runs: Array<[number, number]> = []
  let index = 0

  while (index + SHARED_RUN <= answer.length) {
    if (!openers.has(answer.slice(index, index + SHARED_RUN))) {
      index++
      continue
    }

    let end = index + SHARED_RUN

    while (end < answer.length && source.includes(answer.slice(index, end + 1))) {
      end++
    }

    runs.push([index, end])
    index = end
  }

  return runs
}

/**
 * How much source prose an answer still carries: the longest and the total length
 * of the shared runs that are *not* dominated by verbatim terms, relative to the
 * answer's own visible length. Language-agnostic by construction -- it compares
 * text with text and only discounts runs whose shape says "identifier, URL,
 * markup".
 */
const sharedProse = (
  source: string,
  answer: string,
): { longest: number; cover: number } => {
  const sourceText = visibleText(source)
  const answerText = visibleText(answer)

  if (answerText.length < SHARED_RUN) {
    return { longest: 0, cover: 0 }
  }

  const mask = verbatimMask(answerText, verbatimTerms(source))
  let prose = 0
  let longest = 0

  for (const [start, end] of sharedRuns(answerText, sourceText)) {
    let verbatim = 0

    for (let index = start; index < end; index++) {
      if (mask[index]) {
        verbatim++
      }
    }

    // mostly an identifier, a URL or an acronym the translation kept: not prose
    if (verbatim / (end - start) >= KEEP_FRACTION) {
      continue
    }

    prose += end - start
    longest = Math.max(longest, end - start)
  }

  return { longest, cover: prose / answerText.length }
}

/**
 * Whether an answer still holds a meaningful piece of its source's prose. A long
 * shared run that verbatim terms do not explain -- and that makes up a real share
 * of the answer -- is source text the provider did not translate, so the unit is
 * retried and, if that does not help, reported as `remaining` rather than as
 * translated. The two conditions together are what keeps a link-heavy or
 * identifier-heavy unit from being a false positive.
 */
const isSuspect = (source: string, answer: string): boolean => {
  const { longest, cover } = sharedProse(source, answer)

  return longest >= SHARED_RUN && cover >= SHARED_SHARE
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
        `${CACHE_ORIGIN}/?v=${CACHE_VERSION}&source=${source ?? 'auto'}&target=${target}&hash=${await digest(text)}`,
      )
    : undefined

  if (translationCache && cacheKey) {
    const hit = await translationCache.match(cacheKey).catch(() => undefined)
    const cached = hit
      ? ((await hit.json().catch(() => null)) as TranslatePayload | null)
      : null

    // a failure is cached too, so that a page degrades to the source text; a
    // client-triggered retry must not be answered with that cached failure, only
    // a successful translation may short-circuit it
    if (
      cached &&
      typeof cached.text === 'string' &&
      (cached.translated || !params.retry)
    ) {
      // visible in the Worker logs, so a repeated SSR render can be traced back
      // to the cache instead of the provider
      console.warn(
        '[translate] cache hit',
        `target=${target}`,
        `translated=${cached.translated}`,
        `length=${text.length}`,
      )
      return cached
    }
  }

  // chunks are translated a few at a time, and a chunk that fails (timeout, rate
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
  // Code and prose are separated first, but only `<pre>` is a hard boundary: a
  // whole block (`<p>`, `<li>`, a heading, a table cell) is one unit, so a provider
  // is asked to translate a complete paragraph instead of an arbitrary slice.
  // Inline `<code>` inside a unit is masked with a numbered token rather than split
  // on -- the code is still never sent -- and the original span is spliced back on
  // return; a token a provider did not preserve makes the unit fall back to its
  // prose fragments, exactly as it translated before tokens existed.
  const segments = splitSegments(text)
  const plan: PlanSegment[] = segments.map(segment => {
    if (segment.code) {
      return { code: true, text: segment.text, units: [] }
    }

    return {
      code: false,
      text: segment.text,
      units: splitBlocks(segment.text).map(makeUnit),
    }
  })

  const allUnits = plan.flatMap(segment => segment.units)

  // One subrequest budget for the whole request, the cookie warm-up included.
  // Every outbound call reserves its slot *before* it starts, so the batches and
  // their fallbacks can never push the total past `MAX_SUBREQUESTS`; whatever is
  // left keeps its source text and is reported as `remaining`. Every piece first
  // gets a chance to come out of the per-piece cache, which costs no subrequest at
  // all, so a render cut short by the budget still makes progress on the next one.
  let spent = 0
  const reserve = (): boolean => {
    if (spent >= MAX_SUBREQUESTS) {
      return false
    }

    spent++
    return true
  }

  const unitKeyOf = async (unit: string) =>
    new Request(
      `${CACHE_ORIGIN}/?v=${CACHE_VERSION}&unit=1&source=${source ?? 'auto'}&target=${target}&hash=${await digest(unit)}`,
    )

  let batchCount = 0
  let cachedPieces = 0

  /** Every piece of `units` that still needs a provider. */
  const tasksOf = (units: ProseUnit[]): UnitTask[] => {
    const tasks: UnitTask[] = []

    for (const unit of units) {
      unit.pieces.forEach((piece, index) => {
        if (piece.fixed) {
          // code is answered by itself: never sent, always spliced back
          unit.answers[index] = { text: piece.text, ok: true, translated: false }
          return
        }

        tasks.push({ unit, piece: index, text: piece.text })
      })
    }

    return tasks
  }

  /**
   * Translates every task that is not already cached, spending the shared
   * subrequest budget. An answer is written straight onto its unit, so a unit
   * whose pieces were all answered needs no index bookkeeping.
   */
  const runTasks = async (
    tasks: UnitTask[],
    cookies?: string,
  ): Promise<void> => {
    if (!tasks.length) {
      return
    }

    if (translationCache) {
      await Promise.all(
        tasks.map(async task => {
          const key = await unitKeyOf(task.text)
          const hit = await translationCache
            .match(key)
            .catch(() => undefined)
          const cached = hit
            ? ((await hit.json().catch(() => null)) as PieceResult | null)
            : null

          if (cached && typeof cached.text === 'string') {
            task.unit.answers[task.piece] = cached
            cachedPieces++
          }
        }),
      )
    }

    const misses = tasks.filter(task => !task.unit.answers[task.piece])
    const batches = batchUnits(
      misses.map((task, index) => ({ index, text: task.text })),
    )

    await mapConcurrent(batches, CHUNK_CONCURRENCY, async batch => {
      // one batch is one subrequest, reserved before it is sent; when the budget
      // is used up the batch is skipped and its pieces stay `remaining`
      if (!reserve()) {
        return
      }

      batchCount++

      const answers = await translateBatchWithLibrary(
        batch.map(job => job.text),
        target,
        source,
        cookies,
      ).catch(() => batch.map(() => undefined))

      const failed: BatchJob[] = []

      answers.forEach((answer, position) => {
        const job = batch[position]

        if (!job) {
          return
        }

        const task = misses[job.index]
        const detected = detectedFor(answer?.sourceLang, source)

        if (!task) {
          return
        }

        if (answer && !isUntranslated(task.text, answer.data, target, detected)) {
          task.unit.answers[task.piece] = {
            text: answer.data,
            ok: true,
            translated: !isAlreadyTarget(task.text, answer.data, target, detected),
          }
          return
        }

        failed.push(job)
      })

      // one fallback request per piece the batch could not translate, each one
      // reserved first so the cap holds even with several batches in flight
      await mapConcurrent(failed, CHUNK_CONCURRENCY, async job => {
        const task = misses[job.index]

        if (!task || !service.url || !reserve()) {
          return
        }

        task.unit.answers[task.piece] = await translateChunk({
          chunk: task.text,
          index: job.index,
          total: misses.length,
          target,
          source,
          attempts,
          service,
          skipLibrary: true,
        })
      })
    })
  }

  // the warm-up is an outbound request too, so it comes out of the budget; later
  // batches reuse the cookies and are not charged again
  const warm = await warmOneshot()

  if (warm.fetched) {
    reserve()
  }

  await runTasks(tasksOf(allUnits), warm.cookies)

  /**
   * Rebuilds a unit's text from its answers, splicing masked code back in.
   * `undefined` means the provider did not preserve the tokens, which sends the
   * unit to its fragment fallback instead of risking a corrupted body.
   */
  const rebuild = (unit: ProseUnit): string | undefined => {
    if (!unit.pieces.length) {
      return unit.text
    }

    const joined = unit.pieces
      .map((piece, index) =>
        piece.fixed ? piece.text : (unit.answers[index]?.text ?? piece.text),
      )
      .join('')

    if (!unit.codeSpans.length) {
      return joined
    }

    return unmask(joined, unit.codeSpans)
  }

  for (const unit of allUnits) {
    unit.result = rebuild(unit)
  }

  // a token that did not survive: translate the block's prose fragments on their
  // own, exactly as before tokens existed, so the code is still never sent and the
  // answer still cannot corrupt it
  const fragmented = allUnits.filter(
    unit => unit.result === undefined && unit.fragments,
  )

  if (fragmented.length) {
    console.warn(
      '[translate] inline code tokens did not survive, falling back to fragments',
      `units=${fragmented.length}`,
    )

    for (const unit of fragmented) {
      unit.pieces = unit.fragments as UnitPiece[]
      unit.fragments = undefined
      // the code spans are pieces of their own now, so there is nothing to unmask
      unit.codeSpans = []
      unit.answers = new Array<PieceResult | undefined>(unit.pieces.length)
    }

    await runTasks(tasksOf(fragmented), warm.cookies)

    for (const unit of fragmented) {
      unit.result = rebuild(unit) ?? unit.text
    }
  }

  // a piece the budget did not reach keeps its source text and stays `remaining`
  for (const unit of allUnits) {
    if (unit.result === undefined) {
      unit.result = unit.text
    }
  }

  /**
   * A unit is worth retrying only when it produced a real translation, every one
   * of its pieces was answered, and its answer still carries a meaningful run of
   * source prose.
   */
  const suspects = allUnits.filter(
    unit =>
      unit.result !== undefined &&
      unit.answers.every((answer, index) => answer || unit.pieces[index]?.fixed) &&
      unit.answers.some(answer => answer?.translated) &&
      // a piece the provider said already is the target language stays verbatim
      // by design, so its text is not untranslated prose
      !unit.answers.some(answer => answer?.ok && !answer.translated) &&
      isSuspect(unit.text, unit.result),
  )

  if (suspects.length) {
    console.warn(
      '[translate] units look partly translated',
      `suspects=${suspects.length}`,
      `budget=${spent}/${MAX_SUBREQUESTS}`,
    )
  }

  // one batched DLX request for all of them, reserved like every other call; the
  // answer that shares less source prose wins, so a retry can never make a unit
  // worse, and a unit that still shares a meaningful run is not reported as
  // translated. The batch is bounded like the provider batch above, so a
  // pathological body cannot build one enormous request.
  const retried = suspects.slice(0, BATCH_MAX_TEXTS)

  if (retried.length && service.url && reserve()) {
    const masked = retried.map(unit => maskCode(unit.text))
    const answers = await translateBatchWithDlx(
      masked.map(entry => entry.masked),
      target,
      source,
      service,
    )
    let improved = 0

    retried.forEach((unit, index) => {
      const answer = answers[index]
      const entry = masked[index]
      const current = unit.result

      if (answer === undefined || entry === undefined || current === undefined) {
        return
      }

      const restored = entry.codeSpans.length
        ? unmask(answer, entry.codeSpans)
        : answer

      if (
        restored !== undefined &&
        sharedProse(unit.text, restored).cover <
          sharedProse(unit.text, current).cover
      ) {
        unit.result = restored
        improved++
      }
    })

    console.warn(
      '[translate] DLX batch retry finished',
      `suspects=${retried.length}`,
      `improved=${improved}`,
    )
  }

  for (const unit of suspects) {
    if (unit.result !== undefined && isSuspect(unit.text, unit.result)) {
      unit.suspect = true
    }
  }

  const pieces = allUnits.flatMap(unit =>
    unit.pieces.map((piece, index) => ({
      piece,
      answer: unit.answers[index],
      suspect: unit.suspect,
    })),
  )
  const remainingPieces = pieces.filter(
    entry => !entry.piece.fixed && !entry.answer,
  ).length
  const suspectUnits = allUnits.filter(unit => unit.suspect).length
  const remaining = remainingPieces + suspectUnits

  // cache every piece that produced a real answer, even when the request as a
  // whole was cut short: that is what lets a follow-up request finish the rest
  // instead of re-translating what is already there. A unit that is still
  // suspected of holding source prose is deliberately not cached, so a known
  // partial answer is not served for a day and the next request retries it.
  if (translationCache) {
    await Promise.all(
      pieces.map(async ({ piece, answer, suspect }) => {
        // only a real answer is worth keeping, so a decline is retried next time
        if (piece.fixed || suspect || !answer || (!answer.ok && !answer.translated)) {
          return
        }

        await translationCache
          .put(
            await unitKeyOf(piece.text),
            new Response(JSON.stringify(answer), {
              headers: {
                'content-type': 'application/json',
                'cache-control': `public, max-age=${
                  answer.translated ? CACHE_TTL : CACHE_FAILURE_TTL
                }`,
              },
            }),
          )
          .catch(() => undefined)
      }),
    )
  }

  const failedChunks = pieces.filter(
    entry => entry.answer && !entry.answer.ok,
  ).length
  const translatedPieces = pieces.filter(entry => entry.answer?.translated).length

  const payload: TranslatePayload = {
    // code segments keep their bytes; a unit without pieces is passed through as
    // well; everything else is its (possibly partial) translation
    text: plan
      .map(segment =>
        segment.code
          ? segment.text
          : segment.units.map(unit => unit.result ?? unit.text).join(''),
      )
      .join(''),
    // the client keeps reading `text`; this reports whether the request produced a
    // translation at all. A body that came back whole but unchanged (or that is
    // only code) is complete, yet nothing was translated, so it is not reported as
    // one; a piece that had to fall back is a failure either way, and pieces the
    // budget did not reach -- or that still hold source prose -- are reported as
    // `remaining` so a follow-up request can finish them.
    translated:
      !failedChunks && !remaining && (translatedPieces > 0 || !pieces.length),
    failedChunks,
    remaining,
    subrequests: spent,
  }

  // one line per request, so a partly translated body is visible as a count
  // instead of silently keeping some of its source text; the piece lengths show
  // that an oversized unit was cut at a boundary rather than in the middle
  console.warn(
    '[translate] chunks processed',
    `segments=${segments.length}`,
    `code=${plan.filter(segment => segment.code).length}`,
    `units=${allUnits.length}`,
    `chunks=${pieces.filter(entry => !entry.piece.fixed).length}`,
    `batches=${batchCount}`,
    `cached=${cachedPieces}`,
    `subrequests=${spent}`,
    `remaining=${remaining}`,
    `suspects=${suspectUnits}`,
    `translatedPieces=${translatedPieces}`,
    `failed=${failedChunks}`,
    `translated=${payload.translated}`,
    `target=${target}`,
    `source=${source ?? 'auto'}`,
    `length=${text.length}`,
  )

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
