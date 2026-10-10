import { getBlogConfig } from '../utils/blog'
import { safeInternalPath } from '../utils/path'
import { readSession, writeSession } from '../utils/session'

/**
 * Starts the GitHub OAuth flow.
 *
 * The session (and its `uuid`, used as the OAuth `state`) is created here and
 * set on *this* response, because a `Set-Cookie` written by a server route that
 * is only called internally during SSR (like `/api/info`) does not reach the
 * browser. `/api/login?path=<page>` is a real navigation, so the cookie is
 * guaranteed to be stored before GitHub redirects back to `/api/oauth`.
 */
export default defineEventHandler(async event => {
  const { clientId, oauthCallback } = getBlogConfig(event)

  if (!clientId) {
    throw createError({
      statusCode: 503,
      statusMessage: 'GitHub OAuth app is not configured',
    })
  }

  // Development and production set GITHUB_OAUTH_CALLBACK explicitly. Previews
  // do not, so the origin of the current request is used instead -- combined
  // with GitHub's per-URI "Allow wildcard matching" (any subdomain of the
  // registered redirect URI is accepted) every preview host works without
  // configuring the variable per environment.
  const callback = oauthCallback || `${getRequestURL(event).origin}/api/oauth`

  const session = await readSession(event)
  const uuid = session.uuid || crypto.randomUUID()

  if (!session.uuid) {
    await writeSession(event, { uuid })
  }

  const { path, owner } = getQuery(event) as { path?: string; owner?: string }
  // `path` comes from the query string: reject protocol-relative targets and
  // encode it, otherwise a `?` or `&` inside it would break the redirect_uri
  const target = safeInternalPath(path)

  const authorizeUrl = new URL('https://github.com/login/oauth/authorize')
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('state', uuid)
  authorizeUrl.searchParams.set('redirect_uri', `${callback}?path=${encodeURIComponent(target)}`)

  // A normal visitor keeps the app's existing (minimal) scopes. The maintainer
  // signs in with `?owner=1` once to grant the data scopes the shared OAuth user
  // token needs; the callback still verifies the login before storing anything,
  // so the flag alone grants nothing.
  if (['1', 'true', 'yes'].includes(String(owner ?? '').toLowerCase())) {
    authorizeUrl.searchParams.set('scope', 'read:org read:user')
  }

  return sendRedirect(event, authorizeUrl.toString(), 302)
})
