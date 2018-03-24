import { Locale } from 'types'

export const INFINITY_DATE = 'Fri, 31 Dec 9999 23:59:59 GMT'

export const LOCALE_COOKIE = 'LOCALE_COOKIE'

export const TITLE = '1stG Blog'

const { EN, ZH } = Locale

export const TOGGLE_LOCALE = {
  [EN]: ZH,
  [ZH]: EN,
}

export const DEFAULT_LOCALE = Locale.EN

export const LOCALES = [Locale.EN, Locale.ZH]
