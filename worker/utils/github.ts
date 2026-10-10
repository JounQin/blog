import type { H3Event } from 'h3'

import { getEnv } from './env'
import { getOAuthUserToken } from './oauth-token'
import { readSession } from './session'

interface GraphqlResponse<T> {
  data?: T
  errors?: { message: string }[]
  message?: string
}

/** Which token a request used; the value itself is never part of a cache key. */
type TokenLevel = 'explicit' | 'session' | 'owner' | 'fallback'

const CACHE_ORIGIN = 'https://github-cache.internal'
const CACHE_VERSION = 'v1'
/**
 * GitHub data here is public and changes on the order of minutes (issues,
 * labels, pinned items), while GraphQL's rate limit is per token and every
 * anonymous visitor shares the owner's. Five minutes removes the repeated calls
 * of a busy render/page while keeping the content fresh enough for a blog.
 */
const CACHE_TTL = 300

/** `caches.default` is not typed without the Workers types; stay structural. */
interface EdgeCache {
  match: (request: Request) => Promise<Response | undefined>
  put: (request: Request, response: Response) => Promise<void>
}

const getEdgeCache = (): EdgeCache | undefined =>
  (globalThis as { caches?: { default?: EdgeCache } }).caches?.default

const digest = async (value: string): Promise<string> => {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  )

  return [...new Uint8Array(bytes)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * The cache key is the query, its variables and the token *level* — never a
 * token value. Every query here reads the configured repository/organisation,
 * which is public, so one answer is correct for every identity; keying on the
 * level rather than sharing a single entry also keeps a token that can see more
 * from serving a lesser token's caller. `explicit` requests (the login `viewer`
 * query) are never cached at all, because their answer is per-user.
 */
const cacheKeyOf = async (
  query: string,
  variables: Record<string, unknown>,
  level: TokenLevel,
): Promise<Request> =>
  new Request(
    `${CACHE_ORIGIN}/?${CACHE_VERSION}&level=${level}&hash=${await digest(
      `${query}\n${JSON.stringify(variables)}`,
    )}`,
  )

/** Throws on a hard failure so the caller can fall through to the next token. */
const interpret = <T>(body: GraphqlResponse<T>): T => {
  const message =
    body.errors?.map(error => error.message).join('; ') || body.message

  // GitHub answers with partial data plus `errors` when some nodes are not
  // accessible (for example a token without `read:org`). Only fail hard when
  // there is no data at all, otherwise render what we got instead of blanking
  // the page.
  if (message && !body.data) {
    throw createError({ statusCode: 502, statusMessage: message })
  }

  if (!body.data) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Unexpected empty GitHub GraphQL response',
    })
  }

  if (message) {
    console.warn(
      `[github] partial GraphQL response (${body.errors?.length ?? 1} errors): ${
        body.errors?.[0]?.message ?? message
      }`,
    )
  }

  return body.data
}

/**
 * One GraphQL request with an explicit token and the shared cache layer. Only a
 * clean, successful body is ever stored: a rate limit, a 401 or an empty
 * response is not cached, so the cache cannot poison itself with an error.
 */
const runGraphql = async <T>(
  event: H3Event,
  query: string,
  variables: Record<string, unknown>,
  token: string,
  level: TokenLevel,
): Promise<T> => {
  const { github } = useRuntimeConfig(event)
  const cache = getEdgeCache()
  const cacheKey =
    cache && level !== 'explicit'
      ? await cacheKeyOf(query, variables, level)
      : undefined

  if (cache && cacheKey) {
    const hit = await cache.match(cacheKey).catch(() => undefined)
    const cached = hit
      ? ((await hit.json().catch(() => null)) as GraphqlResponse<T> | null)
      : null

    if (cached?.data) {
      console.warn(`[github] cache hit (${level})`)
      return interpret(cached)
    }
  }

  const body = await $fetch<GraphqlResponse<T>>(
    getEnv(event, 'GITHUB_API_URL', github.apiUrl),
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: `bearer ${token}`,
        'user-agent': '1stg-blog',
      },
      body: { query, variables },
      ignoreResponseError: true,
      // a hanging GitHub request must not hang (or double) the SSR render
      timeout: 15_000,
      retry: 0,
    },
  )

  // never cache an error or a degraded answer: only clean data
  if (cache && cacheKey && body?.data && !body.errors?.length && !body.message) {
    await cache
      .put(
        cacheKey,
        new Response(JSON.stringify(body), {
          headers: {
            'content-type': 'application/json',
            'cache-control': `public, max-age=${CACHE_TTL}`,
          },
        }),
      )
      .catch(() => undefined)
    console.warn(`[github] cache stored (${level})`)
  }

  return interpret(body)
}

/**
 * Minimal GitHub GraphQL client. The token never leaves the Worker: server
 * routes call this, pages go through /api/* so no secret is shipped to the client.
 *
 * Token priority, highest first:
 *
 * 1. the optional per-call `options.token` override (`githubGraphql`'s last
 *    argument). Its real use is the OAuth login flow itself: right after the code
 *    exchange, `/api/oauth` queries `viewer` with the token it has just obtained
 *    -- before any stored token exists -- and also makes the trusted-login check
 *    with it, so it necessarily outranks every lookup below;
 * 2. the **signed-in user's own** OAuth token from this request's session, so a
 *    logged-in visitor reads GitHub with their own identity;
 * 3. the **owner's stored** OAuth user token (`BLOG_OAUTH` KV, refreshed when
 *    needed), which is what serves anonymous visitors -- some organisations
 *    reject classic personal access tokens, so this is the only token that works
 *    for `/api/about` there;
 * 4. `GITHUB_TOKEN`, the fallback.
 *
 * Any failure at a level falls through to the next one: a scope error, an
 * expired token or a 401 is caught and retried, so a stale token degrades
 * instead of turning a route into a 502.
 */
export async function githubGraphql<T>(
  event: H3Event,
  query: string,
  variables: Record<string, unknown>,
  options: { token?: string } = {},
): Promise<T> {
  if (options.token) {
    return runGraphql<T>(event, query, variables, options.token, 'explicit')
  }

  const { githubToken } = useRuntimeConfig(event)
  const fallback = getEnv(event, 'GITHUB_TOKEN', githubToken)

  // 2. the signed-in user's own token, when this request carries a session
  let sessionToken: string | undefined

  try {
    sessionToken = (await readSession(event)).token
  } catch (error) {
    // the session is best effort here: never fail a page because of it
    console.warn('[github] could not read the session token', String(error))
  }

  if (sessionToken && sessionToken !== fallback) {
    try {
      const data = await runGraphql<T>(
        event,
        query,
        variables,
        sessionToken,
        'session',
      )
      console.warn('[github] used the signed-in user token')
      return data
    } catch (error) {
      console.warn(
        '[github] the signed-in user token failed, trying the owner token:',
        String(error),
      )
    }
  }

  // 3. the owner's stored token, which also serves anonymous visitors
  let ownerToken: string | undefined

  try {
    ownerToken = await getOAuthUserToken(event)
  } catch (error) {
    console.warn('[github] could not resolve the owner OAuth token', String(error))
  }

  if (ownerToken && ownerToken !== fallback) {
    try {
      const data = await runGraphql<T>(event, query, variables, ownerToken, 'owner')
      console.warn('[github] used the owner OAuth user token')
      return data
    } catch (error) {
      console.warn(
        '[github] the owner OAuth token failed, falling back to GITHUB_TOKEN:',
        String(error),
      )
    }
  }

  if (!fallback) {
    throw createError({
      statusCode: 503,
      statusMessage: 'GITHUB_TOKEN is not configured',
    })
  }

  console.warn('[github] no signed-in user or owner OAuth token, using GITHUB_TOKEN')

  return runGraphql<T>(event, query, variables, fallback, 'fallback')
}
