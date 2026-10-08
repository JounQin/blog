import { translate } from '@deeplx/core'

import { LOCALE_COOKIE, Locale, TOGGLE_LOCALE } from '../../shared/utils/locale'

/**
 * Translation endpoint used by the `[en]…[zh]…[_end_]` DSL.
 *
 * Powered by `@deeplx/core`, which talks to DeepL's free endpoints, so no API
 * key or other environment variable is required. `Source` is the locale of
 * `SourceText`; the target locale is the opposite one.
 */
const DEEPL_LOCALES: Record<Locale, string> = {
  [Locale.EN]: 'EN',
  [Locale.ZH]: 'ZH',
}

/** `@deeplx/core` rejects anything longer than the anonymous oneshot limit. */
const MAX_CHARS = 1500
// a cold isolate pays a cookie warm-up request first, so the budget is generous
// (measured ~2 s per translation from node, including the session warm-up)
const CHUNK_TIMEOUT = 4000

type TargetLanguage = Parameters<typeof translate>[1]
type SourceLanguage = NonNullable<Parameters<typeof translate>[2]>

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

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const text = typeof query.SourceText === 'string' ? query.SourceText : ''

  if (!text) {
    return { text: '' }
  }

  const requested =
    typeof query.Source === 'string' && query.Source
      ? query.Source
      : getCookie(event, LOCALE_COOKIE)
  const locale = requested === Locale.ZH ? Locale.ZH : Locale.EN

  const target = DEEPL_LOCALES[TOGGLE_LOCALE[locale]] as TargetLanguage
  const source = DEEPL_LOCALES[locale] as SourceLanguage

  // chunks are translated in parallel, and a chunk that fails (timeout, rate
  // limit, ...) keeps its original text, so a long article never blocks the SSR
  const chunks = splitText(text)
  const translated = await Promise.all(
    chunks.map(async chunk => {
      try {
        return await translate(chunk, target, source, {
          signal: AbortSignal.timeout(CHUNK_TIMEOUT),
        })
      } catch {
        return chunk
      }
    }),
  )

  return { text: translated.join('') }
})
