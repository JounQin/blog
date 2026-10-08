import type { Locale } from '#shared/utils/locale'
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  TOGGLE_LOCALE,
} from '#shared/utils/locale'

const ONE_YEAR = 60 * 60 * 24 * 365

export const useLocale = () => {
  const locale = useState<Locale>('locale', () => DEFAULT_LOCALE)

  const setLocale = (value: Locale) => {
    locale.value = value
    const cookie = useCookie<string | null>(LOCALE_COOKIE, {
      path: '/',
      maxAge: ONE_YEAR,
    })
    cookie.value = value
  }

  const toggleLocale = () => setLocale(TOGGLE_LOCALE[locale.value])

  return { locale, setLocale, toggleLocale }
}
