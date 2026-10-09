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
  // a cached value that equals its source is a fallback, not a translation: the
  // client may retry such an entry once (the route's `retry` bypasses its own
  // cached failure), and this records that the one retry already happened
  const retried = useState<Record<string, boolean>>(
    'translate-retried',
    () => ({}),
  )
  // units a render's subrequest budget did not reach: the page shows what it has
  // and the client asks for the rest in follow-up requests
  const remaining = useState<Record<string, number>>(
    'translate-remaining',
    () => ({}),
  )
  const continued = useState<Record<string, number>>(
    'translate-continued',
    () => ({}),
  )

  /** How many follow-up requests a partly translated entry may cost. */
  const MAX_CONTINUATIONS = 4

  const request = async (
    key: string,
    source: string,
    sourceLocale?: string,
    targetLocale?: string,
    retry = false,
  ) => {
    try {
      const { text, remaining: left } = await $fetch<{
        text: string
        remaining?: number
      }>('/api/translate', {
        // POST: a long article body must not have to fit into a URL. No
        // transport retry either -- `retry` in the body only allows one retry
        // inside the route, and only for client-triggered calls; the SSR
        // prefetch stays within a single attempt so a slow provider cannot
        // multiply the render latency
        method: 'POST',
        retry: 0,
        body: {
          text: source,
          source: sourceLocale,
          // the language to produce: the route auto-detects the source itself
          target: targetLocale,
          ...(retry ? { retry: true } : {}),
        },
      })
      cache.value[key] = text
      remaining.value[key] = left ?? 0
    } catch {
      // a failed translation degrades to the source text, never to a placeholder
      cache.value[key] = source
      remaining.value[key] = 0
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

      tasks.push(
        request(key, parsed.source, parsed.sourceLocale, parsed.targetLocale),
      )
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
    // `request` stores the source text when a translation fails, so a cache entry
    // equal to the source is a fallback: it renders (never a placeholder) but it
    // does not count as a successful hit
    const fallback = cached != null && cached === parsed.source
    // a render only spends a fixed subrequest budget, so an entry can be partly
    // translated: it renders what it has and asks for the rest
    const partial = (remaining.value[key] ?? 0) > 0

    if (cached && !fallback && !partial) {
      return buildTranslatedText(parsed, cached)
    }

    if (
      import.meta.client &&
      parsed.source &&
      !pending.value[key] &&
      // a fallback is retried once, a partly translated entry a few times, and a
      // completed one never
      (partial
        ? (continued.value[key] ?? 0) < MAX_CONTINUATIONS
        : !cached || !retried.value[key])
    ) {
      if (partial) {
        continued.value[key] = (continued.value[key] ?? 0) + 1
      } else if (fallback) {
        retried.value[key] = true
      }

      pending.value[key] = true
      void request(
        key,
        parsed.source,
        parsed.sourceLocale,
        parsed.targetLocale,
        true,
      ).finally(() => {
        pending.value[key] = false
      })
    }

    if (cached) {
      return buildTranslatedText(parsed, cached)
    }

    // untagged text (no markers) is readable as-is: never hold it behind the
    // "translating" placeholder while the request is in flight, or after it
    // failed (`request` caches the source text on failure)
    if (parsed.sourceLocale == null) {
      return parsed.text
    }

    return buildTranslatedText(parsed, t('translating') + t('ellipsis'))
  }

  return { locale, setLocale, toggleLocale, t, tt, prefetch }
}
