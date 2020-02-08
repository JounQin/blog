import axios from 'axios'
import Vue from 'vue'
import { Translations, Translator } from 'vue-translator'

import { Locale } from 'types'
import { DEFAULT_LOCALE, LOCALES } from 'utils'

enum Placeholder {
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

const allPlaceholders = {
  [Placeholder.TITLE]: LOCALES.map(titlePlaceholder),
  [Placeholder.CONTENT]: LOCALES.map(contentPlaceholder),
}

const endPlaceholders = {
  [Placeholder.TITLE]: titlePlaceholder('_end_').value,
  [Placeholder.CONTENT]: contentPlaceholder('<em>end</em>').value,
}

const ERROR_TIPS: Record<string, string> = {
  zh: '翻译出现错误',
  en: 'Translation error occurs',
}

const getErrorTip = (locale: string, type: boolean) => {
  const errorTip = ERROR_TIPS[locale] || ERROR_TIPS.en
  return type ? errorTip + ': ' : `<p>${errorTip}</p>`
}

export interface Translate {
  cache?: TranslateCache
  loading?: boolean
  (template: string, type?: boolean): string
}

export interface TranslateCacheData {
  [key: string]: string
}

export interface TranslateCache {
  extract: () => TranslateCacheData
  prefetch: () => Promise<void>
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
export const createTranslate = (
  translator: Translator = Vue.translator,
): Translate => {
  const cacheData: TranslateCacheData =
    (!__SERVER__ && window.__TRANSLATE_CACHE__) || {}
  const storages: Array<Promise<void>> = []

  const instance: Translate = (template, type = true) => {
    const placeholder = type ? Placeholder.TITLE : Placeholder.CONTENT
    const placeholders = allPlaceholders[placeholder]

    let startIndex: number

    placeholders.some(({ value }) => {
      startIndex = template.indexOf(value)
      return startIndex !== -1
    })

    if (startIndex === -1) {
      return template
    }

    const start = template.slice(0, Math.max(0, startIndex))

    const endIndex = template.indexOf(endPlaceholders[placeholder])

    const hasEnd = endIndex !== -1

    const end = hasEnd
      ? template.slice(endIndex + endPlaceholders[placeholder].length)
      : ''

    const main = hasEnd
      ? template.slice(startIndex, endIndex)
      : template.slice(startIndex)

    const indexes: Array<{
      locale: Locale
      placeholder: string
      index: number
    }> = []

    placeholders.forEach(item => {
      const index = main.indexOf(item.value)
      if (index !== -1) {
        indexes.push({
          locale: item.locale as Locale,
          placeholder: item.value,
          index,
        })
      }
    })

    indexes.sort((x, y) => x.index - y.index)

    const translations: Translations = {}

    let firstLocale: string
    let firstTranslation: string

    indexes.forEach((item, index) => {
      const itemIndex = item.index + item.placeholder.length
      const translation =
        index === indexes.length - 1
          ? main.slice(itemIndex)
          : main.slice(itemIndex, indexes[index + 1].index)

      if (!index) {
        firstLocale = item.locale
        firstTranslation = translation
      }

      translations[item.locale] = translation
    })

    const locale = translator.locale as Locale

    let body = (translations[locale] || translations[DEFAULT_LOCALE]) as string

    if (body == null) {
      body = cacheData[main]

      if (!body) {
        body = cacheData[main] =
          translator('translating') + translator('ellipsis')

        instance.loading = true

        const storage = axios
          .get<{ text: string }>('/translate', {
            params: {
              Source: firstLocale,
              SourceText: firstTranslation,
            },
          })
          .then(({ data: { text } }) => {
            cacheData[main] = text
          })
          .catch(() => {
            cacheData[main] = `${getErrorTip(
              firstLocale,
              type,
            )}${firstTranslation}`
          })

        storages.push(storage)
      }
    }

    return start + (body || firstTranslation) + end
  }

  instance.cache = {
    extract: () => cacheData,
    prefetch: () =>
      Promise.all(storages).then(() => {
        storages.length = 0
        instance.loading = false
      }),
  }

  Vue.util.defineReactive(instance, 'loading', false)

  return instance
}

export const translate = __SERVER__ ? null : createTranslate()

Object.defineProperty(
  Vue.prototype,
  '$tt',
  __SERVER__
    ? {
        configurable: __DEV__,
        get(this: Vue) {
          return this.$ssrContext.translate
        },
      }
    : {
        value: translate,
        writable: __DEV__,
      },
)
