import type { SessionUser } from '../utils/session'

import { getBlogConfig } from '../utils/blog'
import { getEnv } from '../utils/env'
import { githubGraphql } from '../utils/github'
import { readSession, writeSession } from '../utils/session'

const VIEWER_QUERY = /* GraphQL */ `
  query viewer {
    viewer {
      avatarUrl
      id
      login
      name
      url
      websiteUrl
    }
  }
`

/**
 * GitHub OAuth callback (ported from `server/router/index.ts`).
 *
 * The login link uses `redirect_uri=<GITHUB_OAUTH_CALLBACK>?path=<fullPath>`,
 * so the original page is restored after the round trip.
 */
export default defineEventHandler(async event => {
  const query = getQuery(event)
  const code = typeof query.code === 'string' ? query.code : ''
  const state = typeof query.state === 'string' ? query.state : ''
  const path = typeof query.path === 'string' ? query.path : ''

  const session = await readSession(event)
  const { clientId, clientSecret } = getBlogConfig(event)

  if (!state || !session.uuid || state !== session.uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'invalid oauth redirect',
    })
  }

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'missing oauth code' })
  }

  if (!clientId || !clientSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'GitHub OAuth app is not configured',
    })
  }

  const tokenResponse = await $fetch<{
    access_token?: string
    error?: string
    error_description?: string
  }>(
    getEnv(
      event,
      'GITHUB_OAUTH_TOKEN_URL',
      'https://github.com/login/oauth/access_token',
    ),
    {
      method: 'POST',
      headers: { accept: 'application/json' },
      body: {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        state,
      },
    },
  )

  if (tokenResponse.error || !tokenResponse.access_token) {
    throw createError({
      statusCode: 400,
      statusMessage:
        tokenResponse.error_description ||
        tokenResponse.error ||
        'oauth token exchange failed',
    })
  }

  const { viewer } = await githubGraphql<{ viewer: SessionUser }>(
    event,
    VIEWER_QUERY,
    {},
    { token: tokenResponse.access_token },
  )

  await writeSession(event, {
    uuid: session.uuid,
    token: tokenResponse.access_token,
    user: viewer,
  })

  // never redirect off-site (the legacy implementation did the same via path)
  const target = path.startsWith('/') ? path : '/'

  return sendRedirect(event, target.replaceAll(' ', '%2B'), 302)
})
