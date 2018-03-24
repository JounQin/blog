import { merge } from 'lodash'
import Vue from 'vue'
import VueTranslator from 'vue-translator'

import { Locale } from 'types'
import { DEFAULT_LOCALE, LOCALE_COOKIE, TOGGLE_LOCALE, getCookie } from 'utils'

Vue.use(VueTranslator, {
  defaultLocale: DEFAULT_LOCALE,
  locale: (!__SERVER__ && (getCookie(LOCALE_COOKIE) as Locale)) || undefined,
  merge,
  translations: {
    en: {
      translating: 'Translating',
      ellipsis: '...',
    },
    zh: {
      translating: '翻译中',
      ellipsis: '……',
    },
  },
})

const { translator } = Vue

translator.toggleLocale = () => {
  translator.locale = TOGGLE_LOCALE[translator.locale as Locale]
}
