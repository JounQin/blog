// Shared locale/site constants (ported from src/utils/constant.ts + src/types/enum.ts)

export enum Locale {
  EN = 'en',
  ZH = 'zh',
}

export enum OwnerType {
  USER = 'user',
  ORGANIZATION = 'organization',
}

export const INFINITY_DATE = 'Fri, 31 Dec 9999 23:59:59 GMT'

export const LOCALE_COOKIE = 'LOCALE_COOKIE'

export const TITLE = '1stG Blog'

export const LOCALES = [Locale.EN, Locale.ZH]

export const DEFAULT_LOCALE = Locale.EN

export const TOGGLE_LOCALE: Record<Locale, Locale> = {
  [Locale.EN]: Locale.ZH,
  [Locale.ZH]: Locale.EN,
}

export const isLocale = (value: unknown): value is Locale =>
  value === Locale.EN || value === Locale.ZH

/**
 * Minimal replacement for the `accept-language` package: picks the first
 * supported locale from an Accept-Language header.
 */
export const parseAcceptLanguage = (
  header: string | null | undefined,
  locales: Locale[] = LOCALES,
): Locale => {
  if (!header) {
    return DEFAULT_LOCALE
  }

  const parsed = header
    .split(',')
    .map(part => {
      const [rawTag = '', ...params] = part.trim().split(';')
      const quality = params
        .map(param => /^q=([\d.]+)$/.exec(param.trim()))
        .find(Boolean)

      return {
        tag: rawTag.trim().toLowerCase(),
        quality: quality ? Number(quality[1]) : 1,
      }
    })
    .filter(({ tag }) => tag)
    .sort((a, b) => b.quality - a.quality)

  for (const { tag } of parsed) {
    const match = locales.find(
      locale => tag === locale || tag.startsWith(`${locale}-`),
    )

    if (match) {
      return match
    }
  }

  return DEFAULT_LOCALE
}
