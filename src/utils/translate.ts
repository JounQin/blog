import axios from 'axios'
import Vue from 'vue'
import { Translations } from 'vue-translator'

import { DEFAULT_LOCALE, LOCALES, Locale, TOGGLE_LOCALE } from './constant'

enum Placehodler {
  TITLE = 'title',
  CONTENT = 'content',
}

const titlePlaceholder = (locale: string) => ({
  locale,
  value: `[${locale}]`,
})

const contentPlaceholder = (locale: string) => ({
  locale,
  value: `<p>[${locale}]</p>`,
})

const Placehodlers = {
  [Placehodler.TITLE]: titlePlaceholder,
  [Placehodler.CONTENT]: contentPlaceholder,
}

const allPlacehodlers = {
  [Placehodler.TITLE]: LOCALES.map(titlePlaceholder),
  [Placehodler.CONTENT]: LOCALES.map(contentPlaceholder),
}

const endPlacehodlers = {
  [Placehodler.TITLE]: titlePlaceholder('_end_').value,
  [Placehodler.CONTENT]: contentPlaceholder('<em>end</em>').value,
}

interface TranslateTemplate {
  (template: string, vm: Vue, placehodler?: Placehodler): string
  loading?: boolean
}

const translationsCache: {
  [key: string]: string
} = {}

/**
 * DSL:
 *
 * title: header [en] title [zh] 标题 [_end_] footer
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
 * 等待更新
 *
 * [_end_]
 *
 * footer
 * ```
 */
const translateTemplate: TranslateTemplate = (template, vm, placehodler) => {
  const placehodlers = allPlacehodlers[placehodler]

  let startIndex

  placehodlers.some(({ value }) => {
    startIndex = template.indexOf(value)
    return startIndex !== -1
  })

  if (startIndex === -1) {
    return template
  }

  const start = template.substring(0, startIndex)

  const endIndex = template.indexOf(endPlacehodlers[placehodler])

  const hasEnd = endIndex !== -1

  const end = hasEnd
    ? template.substr(endIndex + endPlacehodlers[placehodler].length)
    : ''

  const main = hasEnd
    ? template.substring(startIndex, endIndex)
    : template.substr(startIndex)

  const indexes: Array<{
    locale: Locale
    placehodler: string
    index: number
  }> = []

  placehodlers.forEach(item => {
    const index = main.indexOf(item.value)
    if (index !== -1) {
      indexes.push({
        locale: item.locale as Locale,
        placehodler: item.value,
        index,
      })
    }
  })

  indexes.sort((x, y) => x.index - y.index)

  const translations: Translations = {}

  indexes.forEach((item, index) => {
    const itemIndex = item.index + item.placehodler.length
    translations[item.locale] =
      index === indexes.length - 1
        ? main.substr(itemIndex)
        : main.substring(itemIndex, indexes[index + 1].index)
  })

  const locale = vm.$t.locale as Locale

  let body = translations[locale] || translations[DEFAULT_LOCALE]

  const source = TOGGLE_LOCALE[locale]

  const sourceText = main.substr(Placehodlers[placehodler](source).value.length)

  if (!__SERVER__ && body == null) {
    if (translationsCache[main]) {
      return start + translationsCache[main] + end
    }

    axios
      .get('/translate', {
        params: {
          source,
          sourceText,
        },
      })
      .then(({ data: { targetText } }) => {
        translationsCache[main] = targetText
        vm.$forceUpdate()
      })

    body = translationsCache[main] = ' loading... '
  }

  return start + (body || main) + end
}

export const translateTitle: TranslateTemplate = (title, vm) =>
  translateTemplate(title, vm, Placehodler.TITLE)

export const translateContent: TranslateTemplate = (content, vm) =>
  translateTemplate(content, vm, Placehodler.CONTENT)
