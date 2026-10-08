import type { H3Event } from 'h3'

import { getEnv } from './env'

interface GraphqlResponse<T> {
  data?: T
  errors?: { message: string }[]
  message?: string
}

/**
 * Minimal GitHub GraphQL client. The token never leaves the Worker: server
 * routes call this, pages go through /api/* so no secret is shipped to the client.
 *
 * `options.token` is used for user-scoped queries (the OAuth login flow).
 */
export async function githubGraphql<T>(
  event: H3Event,
  query: string,
  variables: Record<string, unknown>,
  options: { token?: string } = {},
): Promise<T> {
  const { githubToken, github } = useRuntimeConfig(event)
  const token = options.token || getEnv(event, 'GITHUB_TOKEN', githubToken)

  if (!token) {
    throw createError({
      statusCode: 503,
      statusMessage: 'GITHUB_TOKEN is not configured',
    })
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
