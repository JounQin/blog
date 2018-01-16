import { merge } from 'lodash'
import Vue from 'vue'
import VueTranslator from 'vue-translator'

import { LOCALE_COOKIE, Locale, getCookie } from 'utils'

const { EN, ZH } = Locale

const TOGGLE_LOCALE = {
  [EN]: ZH,
  [ZH]: EN,
}

Vue.use(VueTranslator, {
  defaultLocale: Locale.ZH,
  locale: (!__SERVER__ && (getCookie(LOCALE_COOKIE) as Locale)) || undefined,
  merge,
})

const { translator } = Vue

translator.toggleLocale = () => {
  translator.locale = TOGGLE_LOCALE[translator.locale as Locale]
}
