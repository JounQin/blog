import type { Locale } from './locale'

import { DEFAULT_LOCALE } from './locale'

export enum Placeholder {
  TITLE = 'title',
  CONTENT = 'content',
}

/** A section marker: the locale it opens and the span it occupies. */
interface Marker {
  locale: string
  index: number
  length: number
}

/**
 * GitHub renders a marker that sits on its own line as a paragraph, and adds
 * attributes to it (`<p dir="auto">[zh]</p>`), so matching the literal
 * `<p>[zh]</p>` used to miss the marker and leak it into the rendered text. A
 * marker is therefore recognized either wrapped in a paragraph (whatever its
 * attributes) or alone on its own line, with any surrounding whitespace and
 * casing.
 */
const SECTION_PATTERN: Record<Placeholder, RegExp> = {
  [Placeholder.TITLE]: /\[\s*(en|zh)\s*\]/gi,
  [Placeholder.CONTENT]:
    /<p\b[^>]*>\s*\[\s*(en|zh)\s*\]\s*<\/p>|(?<=^|\n)[ \t]*\[\s*(en|zh)\s*\][ \t]*(?=\r?\n|$)/gi,
}

/** `[_end_]` closes a title; content uses `<p><em>end</em></p>` or `[_end_]`. */
const END_PATTERN: Record<Placeholder, RegExp> = {
  [Placeholder.TITLE]: /\[\s*_end_\s*\]/gi,
  [Placeholder.CONTENT]:
    /<p\b[^>]*>\s*(?:<em>\s*end\s*<\/em>|\[\s*_end_\s*\])\s*<\/p>|\[\s*_end_\s*\]/gi,
}

/** Any end marker that survived parsing; no marker may reach the reader. */
const stripEndMarkers = (text: string): string =>
  text
    .replace(/<p\b[^>]*>\s*<em>\s*end\s*<\/em>\s*<\/p>/gi, '')
    .replace(/\[\s*_end_\s*\]/gi, '')

/**
 * The cache/state key derived from the marked section. It keeps the locale names
 * (so two templates that only differ by their markers cannot collide) but drops
 * the brackets, because the key is serialized into the page payload and a marker
 * must not appear there either.
 */
const keyOf = (main: string): string =>
  main.replace(/\[\s*(en|zh|_end_)\s*\]/gi, '$1:')

const findSections = (template: string, type: boolean): Marker[] => {
  const pattern = SECTION_PATTERN[type ? Placeholder.TITLE : Placeholder.CONTENT]
  const markers: Marker[] = []

  for (const match of template.matchAll(pattern)) {
    const locale = (match[1] ?? match[2] ?? '').toLowerCase()

    if (locale) {
      markers.push({
        locale,
        index: match.index,
        length: match[0].length,
      })
    }
  }

  return markers
}

const findEnd = (
  template: string,
  type: boolean,
  from: number,
): { index: number; length: number } | undefined => {
  const pattern = END_PATTERN[type ? Placeholder.TITLE : Placeholder.CONTENT]
  pattern.lastIndex = from
  const match = pattern.exec(template)

  return match ? { index: match.index, length: match[0].length } : undefined
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
  const markers = findSections(template, type)
  // the section opens at the first marker in the string; the valid DSL puts `[en]`
  // first, so this is the same marker as before, and it also cannot leave an
  // earlier marker inside `start`
  const first = markers[0]

  if (!first) {
    // No locale markers at all: the text may be in either language, so it is sent
    // as-is and the provider detects the source. The `auto:` prefix can never be
    // the start of a marked template's key (`main` always begins with `[en]`,
    // `[zh]` or `<p>[…]</p>`), so an untagged entry can never collide with a
    // marked one; the locale is part of the key because the same untagged text is
    // translated differently per target. A stray end marker means nothing on its
    // own, so it is dropped rather than rendered.
    const source = stripEndMarkers(template)

    return {
      text: source,
      needsRemote: Boolean(source),
      key: `auto:${locale}:${source}`,
      source,
      targetLocale: locale,
    }
  }

  const startIndex = first.index
  const start = template.slice(0, Math.max(0, startIndex))
  const endMarker = findEnd(template, type, startIndex)
  const end = endMarker
    ? template.slice(endMarker.index + endMarker.length)
    : ''
  const main = template.slice(
    startIndex,
    endMarker ? endMarker.index : undefined,
  )

  const indexes = markers
    .filter(
      marker =>
        marker.index >= startIndex &&
        marker.index < startIndex + main.length,
    )
    .sort((a, b) => a.index - b.index)

  const translations: Partial<Record<string, string>> = {}

  let firstLocale: string | undefined
  let firstTranslation: string | undefined

  indexes.forEach((marker, index) => {
    const itemIndex = marker.index + marker.length - startIndex
    const nextIndex = indexes[index + 1]?.index
    const translation =
      nextIndex == null
        ? main.slice(itemIndex)
        : main.slice(itemIndex, nextIndex - startIndex)

    if (!index) {
      firstLocale = marker.locale
      firstTranslation = translation
    }

    translations[marker.locale] = translation
  })

  const body = translations[locale] || translations[DEFAULT_LOCALE]

  if (body != null) {
    return { text: stripEndMarkers(start + body + end), needsRemote: false }
  }

  const source = firstTranslation || ''

  return {
    text: stripEndMarkers(start + source + end),
    // an empty first section has nothing to translate: staying remote would show
    // the "translating" placeholder forever, because the composable never fires a
    // request for an empty source
    needsRemote: Boolean(source),
    key: keyOf(main),
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
): string =>
  stripEndMarkers((parsed.start || '') + body + (parsed.end || ''))
