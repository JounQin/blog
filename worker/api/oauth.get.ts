import type { SessionUser } from '../utils/session'
import { safeInternalPath } from '../utils/path'

import { getBlogConfig } from '../utils/blog'
import { getEnv } from '../utils/env'
import { githubGraphql } from '../utils/github'
import {
  captureOwnerOAuthToken,
  getTrustedLogin,
} from '../utils/oauth-token'
import { readSession, writeSession } from '../utils/session'

const VIEWER_QUERY = /* GraphQL */ `
  query viewer {
    viewer {
      avatarUrl
      databaseId
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
    refresh_token?: string
    expires_in?: number
    scope?: string
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

  // Only the maintainer's sign-in may populate the shared OAuth user token:
  // some organisations reject classic personal access tokens, and an anonymous
  // render carries no session cookie, so this token is what lets `/api/about`
  // work for everyone. Best effort: a KV problem never breaks the login.
  try {
    const trustedLogin = getTrustedLogin(event)

    if (
      trustedLogin &&
      viewer.login.toLowerCase() === trustedLogin.toLowerCase()
    ) {
      // `captureOwnerOAuthToken` applies the identity-pinning write rule: the
      // numeric id is recorded on the first bootstrap, and a later sign-in whose
      // account id differs is refused rather than overwriting the owner's entry.
      const result = await captureOwnerOAuthToken(event, {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: tokenResponse.expires_in
          ? Date.now() + tokenResponse.expires_in * 1000
          : undefined,
        login: viewer.login,
        id: viewer.databaseId,
        scopes: tokenResponse.scope,
      })

      console.warn(
        '[oauth-token] maintainer sign-in',
        `login=${viewer.login}`,
        `result=${result}`,
        `scopes=${JSON.stringify(tokenResponse.scope ?? '')}`,
      )
    }
  } catch (error) {
    console.warn(
      '[oauth-token] could not store the maintainer token',
      String(error),
    )
  }

  await writeSession(event, {
    uuid: session.uuid,
    token: tokenResponse.access_token,
    user: viewer,
  })

  // never redirect off-site (the legacy implementation did the same via path)
  const target = safeInternalPath(path)

  return sendRedirect(event, target.replaceAll(' ', '%20'), 302)
})
