import type { H3Event } from 'h3'

import { getEnv } from './env'
import type { StoredOAuthToken } from './oauth-token'
import { getUsableOwnerToken, markOwnerTokenRejected } from './oauth-token'
import { readSession } from './session'

interface GraphqlResponse<T> {
  data?: T
  errors?: { message: string }[]
  message?: string
}

/**
 * Which token a request used. Used for logging and for the "last level tolerates
 * partial data" rule; it is deliberately **not** the cache identity.
 */
type TokenLevel = 'explicit' | 'session' | 'owner' | 'fallback'

const CACHE_ORIGIN = 'https://github-cache.internal'
const CACHE_VERSION = 'v2'
/**
 * GitHub data changes on the order of minutes (issues, labels, pinned items),
 * while GraphQL's rate limit is per token and every anonymous visitor shares the
 * owner's. Five minutes removes the repeated calls of a busy render/page while
 * keeping the content fresh enough for a blog.
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
 * The cache identity for a level: what must be equal for two requests to be
 * allowed to share a body.
 *
 * The data is *not* uniformly public — the same query returns different nodes
 * for a member of a private organisation than for a non-member — so the key must
 * never be the coarse level alone. It is:
 *
 * - `explicit`: never cached (the login `viewer` query is per-user);
 * - `session` / `owner`: the account's numeric GitHub id, `user:<id>` /
 *   `owner:<id>`. Two requests from the same account see the same data: the
 *   account determines both the private resources it can reach and (because
 *   every sign-in requests the same read-only scopes) the scopes granted, so the
 *   identity is stable even when its token is rotated;
 * - a SHA-256 fingerprint of the token actually used, for a legacy session with
 *   no recorded account id (`user:token:<hash>`) or the fallback
 *   (`fallback:<hash>`), where the token itself is the only identity available.
 *
 * A raw token never appears in a key, and a stale or rotated token at the same
 * account id keeps the same key, so it does not wipe the cache.
 */
const cacheKeyOf = async (
  query: string,
  variables: Record<string, unknown>,
  identity: string,
): Promise<Request> =>
  new Request(
    `${CACHE_ORIGIN}/?${CACHE_VERSION}&identity=${identity}&hash=${await digest(
      `${query}\n${JSON.stringify(variables)}`,
    )}`,
  )

/**
 * Whether an upstream failure looks like the token itself being rejected rather
 * than a transient network or parse problem. Only then is the per-isolate cache
 * dropped, so a temporary failure does not throw away a good token.
 */
const isRejectedToken = (error: unknown): boolean => {
  const statusCode = (error as { statusCode?: number } | undefined)?.statusCode
  const message = String(
    (error as { statusMessage?: string } | undefined)?.statusMessage ??
      (error as Error | undefined)?.message ??
      error,
  )

  return (
    statusCode === 401 ||
    statusCode === 403 ||
    /bad credentials|requires authentication|forbidden|not been granted|resource not accessible|permission/i.test(
      message,
    )
  )
}

/**
 * Whether the token's *credentials* are bad, as opposed to a token that is
 * merely under-scoped for the query. Only this narrower class is persisted in
 * KV: an under-scoped (but valid) token may still serve other queries, so it is
 * only dropped from the isolate cache, while a bad credential must be marked so
 * that other isolates stop retrying it once they observe the mark (KV is
 * eventually consistent, so that is best effort, never a correctness
 * requirement).
 */
const isAuthFailure = (error: unknown): boolean => {
  const statusCode = (error as { statusCode?: number } | undefined)?.statusCode
  const message = String(
    (error as { statusMessage?: string } | undefined)?.statusMessage ??
      (error as Error | undefined)?.message ??
      error,
  )

  return (
    statusCode === 401 ||
    /bad credentials|requires authentication/i.test(message)
  )
}

/**
 * Turns a GraphQL body into data, or throws so the caller can fall through to the
 * next token.
 *
 * `strict` is for every level that has somewhere to fall through to (the login
 * override, the signed-in user's token and the owner's token): *any* GraphQL
 * error there means "this token cannot serve the query", even when GitHub
 * returned partial data, so the next token gets a chance. Only the last level
 * (`GITHUB_TOKEN`) tolerates partial data -- by then there is nothing left to try
 * and rendering what came back beats blanking the page.
 */
const interpret = <T>(body: GraphqlResponse<T>, strict: boolean): T => {
  const message =
    body.errors?.map(error => error.message).join('; ') || body.message

  // GitHub answers with partial data plus `errors` when some nodes are not
  // accessible (for example a token without `read:org`).
  if (message && (strict || !body.data)) {
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
 *
 * `identity` (see `cacheKeyOf`) is what a body may be shared across; the level
 * is only used for logging and for the partial-data rule.
 */
const runGraphql = async <T>(
  event: H3Event,
  query: string,
  variables: Record<string, unknown>,
  token: string,
  level: TokenLevel,
  identity: string,
): Promise<T> => {
  const { github } = useRuntimeConfig(event)
  const cache = getEdgeCache()
  const cacheKey =
    cache && level !== 'explicit'
      ? await cacheKeyOf(query, variables, identity)
      : undefined

  if (cache && cacheKey) {
    const hit = await cache.match(cacheKey).catch(() => undefined)
    const cached = hit
      ? ((await hit.json().catch(() => null)) as GraphqlResponse<T> | null)
      : null

    if (cached?.data) {
      console.warn(`[github] cache hit (${identity})`)
      return interpret(cached, level !== 'fallback')
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
    console.warn(`[github] cache stored (${identity})`)
  }

  return interpret(body, level !== 'fallback')
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
 * Any failure at a level falls through to the next one. For every level except
 * the last, a GraphQL `errors` payload is a failure even when partial `data`
 * came with it (a token without `read:org` must not silently serve half an
 * org profile); only `GITHUB_TOKEN`, which has nowhere left to go, tolerates
 * partial data. A rejected owner token also drops the per-isolate cache, so the
 * next request re-reads KV or refreshes instead of retrying a dead token.
 */
export async function githubGraphql<T>(
  event: H3Event,
  query: string,
  variables: Record<string, unknown>,
  options: { token?: string } = {},
): Promise<T> {
  if (options.token) {
    return runGraphql<T>(event, query, variables, options.token, 'explicit', '')
  }

  const { githubToken } = useRuntimeConfig(event)
  const fallback = getEnv(event, 'GITHUB_TOKEN', githubToken)

  // 2. the signed-in user's own token, when this request carries a session
  let session: Awaited<ReturnType<typeof readSession>> = {}

  try {
    session = await readSession(event)
  } catch (error) {
    // the session is best effort here: never fail a page because of it
    console.warn('[github] could not read the session token', String(error))
  }

  const sessionToken = session.token

  if (sessionToken && sessionToken !== fallback) {
    // the account id is the stable identity; a session created before it was
    // recorded only has its token, so fall back to its fingerprint
    const identity = session.user?.databaseId
      ? `user:${session.user.databaseId}`
      : `user:token:${await digest(sessionToken)}`

    try {
      const data = await runGraphql<T>(
        event,
        query,
        variables,
        sessionToken,
        'session',
        identity,
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
  let owner: StoredOAuthToken | undefined

  try {
    owner = await getUsableOwnerToken(event)
  } catch (error) {
    console.warn('[github] could not resolve the owner OAuth token', String(error))
  }

  if (owner?.accessToken && owner.accessToken !== fallback) {
    // the pinned account id keeps the key stable across a token rotation, so a
    // rotated owner token does not wipe the cache
    const identity =
      typeof owner.id === 'number' && owner.id > 0
        ? `owner:${owner.id}`
        : `owner:token:${await digest(owner.accessToken)}`

    try {
      const data = await runGraphql<T>(
        event,
        query,
        variables,
        owner.accessToken,
        'owner',
        identity,
      )
      console.warn('[github] used the owner OAuth user token')
      return data
    } catch (error) {
      if (isRejectedToken(error)) {
        // drop the isolate cache; a credential failure is also marked under its
        // own key, naming the exact token that failed, so no other isolate
        // retries it and a concurrent sign-in cannot be clobbered
        await markOwnerTokenRejected(
          event,
          owner.accessToken,
          isAuthFailure(error),
        )
        console.warn('[github] dropped the rejected owner OAuth token from the cache')
      }
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

  // the fallback has no account to key on, so its own fingerprint is the identity
  return runGraphql<T>(
    event,
    query,
    variables,
    fallback,
    'fallback',
    `fallback:${await digest(fallback)}`,
  )
}
