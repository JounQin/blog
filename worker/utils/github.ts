import type { H3Event } from 'h3'

import { getEnv } from './env'
import { getOAuthUserToken } from './oauth-token'

interface GraphqlResponse<T> {
  data?: T
  errors?: { message: string }[]
  message?: string
}

/** One GraphQL request with an explicit token; throws on a hard failure. */
const runGraphql = async <T>(
  event: H3Event,
  query: string,
  variables: Record<string, unknown>,
  token: string,
): Promise<T> => {
  const { github } = useRuntimeConfig(event)

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

  const message =
    body.errors?.map(error => error.message).join('; ') || body.message

  // GitHub answers with partial data plus `errors` when some nodes are not
  // accessible (for example a fine-grained token restricted by an organization
  // policy). Only fail hard when there is no data at all, otherwise render what
  // we got instead of blanking the page.
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
 * Minimal GitHub GraphQL client. The token never leaves the Worker: server
 * routes call this, pages go through /api/* so no secret is shipped to the client.
 *
 * Token priority:
 *
 * 1. `options.token`, used for user-scoped queries (the OAuth login flow);
 * 2. the maintainer's stored OAuth **user** token (`BLOG_OAUTH` KV, refreshed
 *    when needed). Some organisations reject classic personal access tokens, and
 *    an anonymous render has no session, so this is the only token that works
 *    for `/api/about` there;
 * 3. `GITHUB_TOKEN`, the fallback.
 *
 * A failure of (2) never reaches the page: the request is retried with (3), so a
 * missing, expired or rejected user token degrades instead of turning a route
 * into a 502.
 */
export async function githubGraphql<T>(
  event: H3Event,
  query: string,
  variables: Record<string, unknown>,
  options: { token?: string } = {},
): Promise<T> {
  if (options.token) {
    return runGraphql<T>(event, query, variables, options.token)
  }

  const { githubToken } = useRuntimeConfig(event)
  const fallback = getEnv(event, 'GITHUB_TOKEN', githubToken)

  let preferred: string | undefined

  try {
    preferred = await getOAuthUserToken(event)
  } catch (error) {
    // the stored-token path is best effort: never fail a page because of it
    console.warn('[github] could not resolve the OAuth user token', String(error))
  }

  if (preferred) {
    try {
      const data = await runGraphql<T>(event, query, variables, preferred)
      console.warn('[github] used the stored OAuth user token')
      return data
    } catch (error) {
      console.warn(
        '[github] the OAuth user token failed, falling back to GITHUB_TOKEN:',
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

  if (!preferred) {
    console.warn('[github] no stored OAuth user token, using GITHUB_TOKEN')
  }

  return runGraphql<T>(event, query, variables, fallback)
}
