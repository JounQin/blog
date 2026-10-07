import type {
  Locale} from '#shared/utils/locale';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  TOGGLE_LOCALE,
  isLocale,
  parseAcceptLanguage,
} from '#shared/utils/locale'

/**
 * Initialises the locale from the cookie / Accept-Language header before the
 * first render (the legacy Koa SSR middleware did the same and wrote the cookie).
 */
export default defineNuxtPlugin(() => {
  const cookie = useCookie<string | null>(LOCALE_COOKIE, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  const locale = useState<Locale>('locale', () => DEFAULT_LOCALE)

  if (isLocale(cookie.value)) {
    locale.value = cookie.value
    return
  }

  const detected = import.meta.server
    ? parseAcceptLanguage(
        useRequestHeaders(['accept-language'])['accept-language'],
      )
    : DEFAULT_LOCALE

  locale.value = detected
  cookie.value = detected
})

export { TOGGLE_LOCALE }
