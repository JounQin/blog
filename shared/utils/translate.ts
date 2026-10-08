import type { Locale } from './locale'

import { DEFAULT_LOCALE, LOCALES } from './locale'

export enum Placeholder {
  TITLE = 'title',
  CONTENT = 'content',
}

interface Candidate {
  locale: string
  value: string
}

const titlePlaceholder = (locale: string): Candidate => ({
  locale,
  value: `[${locale}]`,
})

const contentPlaceholder = (locale: string): Candidate => ({
  locale,
  value: `<p>[${locale}]</p>`,
})

const candidates: Record<Placeholder, Candidate[]> = {
  [Placeholder.TITLE]: LOCALES.map(locale => titlePlaceholder(locale)),
  [Placeholder.CONTENT]: LOCALES.map(locale => contentPlaceholder(locale)),
}

const endPlaceholders: Record<Placeholder, string> = {
  [Placeholder.TITLE]: titlePlaceholder('_end_').value,
  [Placeholder.CONTENT]: contentPlaceholder('<em>end</em>').value,
}

export interface ParsedTranslation {
  /** the template with the section of `locale` (or of the default locale) selected */
  text: string
  /** `true` when the section has to be fetched from /api/translate */
  needsRemote: boolean
  /** cache key + payload for the remote translation */
  key?: string
  source?: string
  /** the language of `source`, when the template labels it */
  sourceLocale?: string
  /** the language to produce; sent to /api/translate as `target` */
  targetLocale?: string
  start?: string
  end?: string
}

/**
 * Ported from src/plugins/translate.ts of the Vue 2 implementation.
 *
 * DSL (the markers are locale tags, the text between them is the per-locale
 * content and may be in any language):
 *
 * title: `header [en] English title [zh] Chinese title [_end_] footer`
 *
 * content:
 * ```
 * header
 *
 * [en]
 *
 * Wait for update
 *
 * [zh]
 *
 * Still being written
 *
 * [_end_]
 *
 * footer
 * ```
 */
export const parseTranslation = (
  template: string,
  locale: Locale,
  type = true,
): ParsedTranslation => {
  const placeholder = type ? Placeholder.TITLE : Placeholder.CONTENT
  const items = candidates[placeholder]

  let startIndex = -1

  for (const { value } of items) {
    startIndex = template.indexOf(value)
    if (startIndex !== -1) {
      break
    }
  }

  if (startIndex === -1) {
    // No locale markers at all: the text may be in either language, so it is sent
    // as-is and the provider detects the source. The `auto:` prefix can never be
    // the start of a marked template's key (`main` always begins with `[en]`,
    // `[zh]` or `<p>[…]</p>`), so an untagged entry can never collide with a
    // marked one; the locale is part of the key because the same untagged text is
    // translated differently per target.
    return {
      text: template,
      needsRemote: true,
      key: `auto:${locale}:${template}`,
      source: template,
      targetLocale: locale,
    }
  }

  const start = template.slice(0, Math.max(0, startIndex))
  const endPlaceholder = endPlaceholders[placeholder]
  const endIndex = template.indexOf(endPlaceholder)
  const hasEnd = endIndex !== -1
  const end = hasEnd ? template.slice(endIndex + endPlaceholder.length) : ''
  const main = hasEnd
    ? template.slice(startIndex, endIndex)
    : template.slice(startIndex)

  const indexes = items
    .map(item => ({ ...item, index: main.indexOf(item.value) }))
    .filter(({ index }) => index !== -1)
    .sort((a, b) => a.index - b.index)

  const translations: Partial<Record<string, string>> = {}

  let firstLocale: string | undefined
  let firstTranslation: string | undefined

  indexes.forEach((item, index) => {
    const itemIndex = item.index + item.value.length
    const nextIndex = indexes[index + 1]?.index
    const translation =
      nextIndex == null
        ? main.slice(itemIndex)
        : main.slice(itemIndex, nextIndex)

    if (!index) {
      firstLocale = item.locale
      firstTranslation = translation
    }

    translations[item.locale] = translation
  })

  const body = translations[locale] || translations[DEFAULT_LOCALE]

  if (body != null) {
    return { text: start + body + end, needsRemote: false }
  }

  const source = firstTranslation || ''

  return {
    text: start + source + end,
    // an empty first section has nothing to translate: staying remote would show
    // the "translating" placeholder forever, because the composable never fires a
    // request for an empty source
    needsRemote: Boolean(source),
    key: main,
    source,
    sourceLocale: firstLocale,
    // the section of `locale` is missing, so the first one is translated into it
    targetLocale: locale,
    start,
    end,
  }
}

export const buildTranslatedText = (
  parsed: ParsedTranslation,
  body: string,
): string => (parsed.start || '') + body + (parsed.end || '')
