import { Translations } from 'vue-translator'

import { DEFAULT_LOCALE, LOCALES, Locale } from './constant'

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

const allPlacehodlers = {
  [Placehodler.TITLE]: LOCALES.map(titlePlaceholder),
  [Placehodler.CONTENT]: LOCALES.map(contentPlaceholder),
}

const END = '_end_'

const endPlacehodlers = {
  [Placehodler.TITLE]: titlePlaceholder(END).value,
  [Placehodler.CONTENT]: contentPlaceholder(END).value,
}

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
const translateTemplate = (
  template: string,
  locale: Locale,
  placehodler: Placehodler,
) => {
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

  const end = hasEnd ? template.substr(endIndex) : ''

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

  return (
    start + (translations[locale] || translations[DEFAULT_LOCALE] || '') + end
  )
}

export const translateTitle = (title: string, locale: Locale) =>
  translateTemplate(title, locale, Placehodler.TITLE)

export const translateContent = (content: string, locale: Locale) =>
  translateTemplate(content, locale, Placehodler.CONTENT)
