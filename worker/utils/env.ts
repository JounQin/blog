import type { H3Event } from 'h3'

/**
 * Reads deployment environment variables.
 *
 * The legacy Vue 2 / Koa deployment used plain names (`GITHUB_TOKEN`,
 * `GITHUB_CLIENT_ID`, ...), so those are supported first; the `NUXT_`-prefixed
 * runtimeConfig values (populated by Nitro) still work as a fallback.
 *
 * Sources, in order: the Cloudflare Worker bindings (secrets/vars), `process.env`
 * (used by `nuxt dev`, Node presets and also populated from the Worker bindings
 * when `nodejs_compat` is enabled).
 */
export const getCloudflareEnv = (
  event: H3Event,
): Record<string, unknown> =>
  (event.context as { cloudflare?: { env?: Record<string, unknown> } })
    .cloudflare?.env ?? {}

export const getEnv = (
  event: H3Event,
  name: string,
  fallback = '',
): string => {
  const fromCloudflare = getCloudflareEnv(event)[name]

  if (typeof fromCloudflare === 'string' && fromCloudflare) {
    return fromCloudflare
  }

  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[name]

    if (value) {
      return value
    }
  }

  return fallback || ''
}
