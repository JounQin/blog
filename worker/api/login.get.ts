import { getBlogConfig } from '../utils/blog'
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

  if (!clientId || !oauthCallback) {
    throw createError({
      statusCode: 503,
      statusMessage: 'GitHub OAuth app is not configured',
    })
  }

  const session = await readSession(event)
  const uuid = session.uuid || crypto.randomUUID()

  if (!session.uuid) {
    await writeSession(event, { uuid })
  }

  const { path } = getQuery(event) as { path?: string }
  const target = typeof path === 'string' && path.startsWith('/') ? path : '/'

  const authorizeUrl = new URL('https://github.com/login/oauth/authorize')
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('state', uuid)
  authorizeUrl.searchParams.set('redirect_uri', `${oauthCallback}?path=${target}`)

  return sendRedirect(event, authorizeUrl.toString(), 302)
})
