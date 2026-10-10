import type { H3Event } from 'h3'

import { sha256Hex } from './digest'
import { getEnv } from './env'
import type { UsableOwnerToken } from './oauth-token'
import { getUsableOwnerToken, markOwnerTokenRejected } from './oauth-token'
import { readSession } from './session'

interface GraphqlResponse<T> {
  data?: T
  errors?: { message: string }[]
  message?: string
}

/**
 * Which token a request used. It drives the logging, the "last level tolerates
 * partial data" rule and the decision not to cache the `explicit` override; it
 * is deliberately **not** the cache identity (see `cacheKeyOf`).
 */
type TokenLevel = 'explicit' | 'session' | 'owner' | 'fallback'

const CACHE_ORIGIN = 'https://github-cache.internal'
/**
 * The cache is new with this change (it did not exist before), so the first
 * published shape is `v1`. The slot exists only as a cheap future invalidation
 * lever: bump it if the key shape changes.
 */
const CACHE_VERSION = 'v1'
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
    `${CACHE_ORIGIN}/?${CACHE_VERSION}&identity=${identity}&hash=${await sha256Hex(
      `${query}\n${JSON.stringify(variables)}`,
    )}`,
  )

/**
 * Parses an upstream failure once. `rejected` is the union of the credential and
 * permission signals (any of them means the token cannot serve the query, so the
 * isolate cache must be dropped); `credential` is the narrower subset that also
 * justifies persisting the rejection mark, since an under-scoped-but-valid token
 * may still serve other queries.
 */
const parseRejection = (
  error: unknown,
): { rejected: boolean; credential: boolean } => {
  const statusCode = (error as { statusCode?: number } | undefined)?.statusCode
  const message = String(
    (error as { statusMessage?: string } | undefined)?.statusMessage ??
      (error as Error | undefined)?.message ??
      error,
  )
  const credential =
    statusCode === 401 || /bad credentials|requires authentication/i.test(message)

  return {
    credential,
    rejected:
      credential ||
      statusCode === 403 ||
      /forbidden|not been granted|resource not accessible|permission/i.test(
        message,
      ),
  }
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
      console.debug(`[github] cache hit (${identity})`)
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
    console.debug(`[github] cache stored (${identity})`)
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
 * Every level except the explicit override (which *is* the login flow, so it
 * returns its result directly) falls through to the next one on failure. For
 * every level except the last, a GraphQL `errors` payload is a failure even when
 * partial `data` came with it (a token without `read:org` must not silently serve
 * half an org profile); only `GITHUB_TOKEN`, which has nowhere left to go,
 * tolerates partial data. A rejected owner token also drops the per-isolate
 * cache, so the next request re-reads KV or refreshes instead of retrying a dead
 * token.
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
      : `user:token:${await sha256Hex(sessionToken)}`

    try {
      const data = await runGraphql<T>(
        event,
        query,
        variables,
        sessionToken,
        'session',
        identity,
      )
      console.debug('[github] used the signed-in user token')
      return data
    } catch (error) {
      console.warn(
        '[github] the signed-in user token failed, trying the owner token:',
        String(error),
      )
    }
  }

  // 3. the owner's stored token, which also serves anonymous visitors
  let owner: UsableOwnerToken | undefined

  try {
    owner = await getUsableOwnerToken(event)
  } catch (error) {
    console.warn('[github] could not resolve the owner OAuth token', String(error))
  }

  if (owner && owner.accessToken !== fallback) {
    // the pinned account id keeps the key stable across a token rotation, so a
    // rotated owner token does not wipe the cache
    try {
      const data = await runGraphql<T>(
        event,
        query,
        variables,
        owner.accessToken,
        'owner',
        `owner:${owner.id}`,
      )
      console.debug('[github] used the owner OAuth user token')
      return data
    } catch (error) {
      const rejection = parseRejection(error)

      if (rejection.rejected) {
        // drop the isolate cache; a credential failure is also marked under its
        // own key, naming the exact token that failed, so other isolates stop
        // retrying it and a concurrent sign-in cannot be clobbered
        await markOwnerTokenRejected(
          event,
          owner.accessToken,
          rejection.credential,
        )
      }

      console.warn(
        `[github] the owner OAuth token failed${
          rejection.rejected ? ' (cache dropped)' : ''
        }, falling back to GITHUB_TOKEN:`,
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

  console.debug('[github] no signed-in user or owner OAuth token, using GITHUB_TOKEN')

  // the fallback has no account to key on, so its own fingerprint is the identity
  return runGraphql<T>(
    event,
    query,
    variables,
    fallback,
    'fallback',
    `fallback:${await sha256Hex(fallback)}`,
  )
}
