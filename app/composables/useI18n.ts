import { DEFAULT_LOCALE } from '#shared/utils/locale'
import { buildTranslatedText, parseTranslation } from '#shared/utils/translate'

import { messages } from '~/i18n/messages'

import { useLocale } from './useLocale'

export const useI18n = () => {
  const { locale, setLocale, toggleLocale } = useLocale()

  /** `$t(key, args)` of vue-translator (`{ 0 }` placeholders) */
  const t = (key: string, args: Array<string | number> = []) => {
    const message =
      messages[locale.value]?.[key] ?? messages[DEFAULT_LOCALE][key] ?? key

    return message.replaceAll(
      /\{\s*(\d+)\s*\}/g,
      (_match, index: string) => `${args[Number(index)] ?? ''}`,
    )
  }

  // per-request on the server (never a module level cache: Workers reuse isolates)
  const cache = useState<Record<string, string>>('translate-cache', () => ({}))
  const pending = useState<Record<string, boolean>>(
    'translate-pending',
    () => ({}),
  )

  const request = async (key: string, source: string, sourceLocale?: string) => {
    try {
      const { text } = await $fetch<{ text: string }>('/api/translate', {
        // no retry: a slow provider must not multiply the SSR latency
        retry: 0,
        params: { Source: sourceLocale, SourceText: source },
      })
      cache.value[key] = text
    } catch {
      // keep the placeholder, the page still renders
    }
  }

  /**
   * Resolves the remote translations of `templates` before rendering, so the
   * SSR output already contains the translated text (the legacy implementation
   * did the same with `translate.cache.prefetch()`).
   */
  const prefetch = async (
    templates: Array<string | undefined>,
    type = true,
  ) => {
    const tasks: Array<Promise<void>> = []

    for (const template of templates) {
      if (!template) {
        continue
      }

      const parsed = parseTranslation(template, locale.value, type)
      const key = parsed.key

      if (!parsed.needsRemote || !key || !parsed.source || cache.value[key]) {
        continue
      }

      tasks.push(request(key, parsed.source, parsed.sourceLocale))
    }

    await Promise.all(tasks)
  }

  const tt = (template?: string, type = true) => {
    if (!template) {
      return template ?? ''
    }

    const parsed = parseTranslation(template, locale.value, type)

    if (!parsed.needsRemote) {
      return parsed.text
    }

    const key = parsed.key as string
    const cached = cache.value[key]

    if (cached) {
      return buildTranslatedText(parsed, cached)
    }

    if (import.meta.client && parsed.source && !pending.value[key]) {
      pending.value[key] = true
      void request(key, parsed.source, parsed.sourceLocale).finally(() => {
        pending.value[key] = false
      })
    }

    return buildTranslatedText(parsed, t('translating') + t('ellipsis'))
  }

  return { locale, setLocale, toggleLocale, t, tt, prefetch }
}
