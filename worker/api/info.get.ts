import { getBlogConfig } from '../utils/blog'
import { readSession } from '../utils/session'

/**
 * Public runtime configuration + the current user.
 *
 * Same shape as the legacy `/api/fetchInfo`, except that the session is created
 * by `/api/login`: a `Set-Cookie` written by a route that is only called
 * internally during SSR (like this one) does not reach the browser.
 */
export default defineEventHandler(async event => {
  const {
    owner,
    name,
    ownerType,
    clientId,
    oauthCallback,
    excludedLabels,
    excludedRepositoryOwners,
  } = getBlogConfig(event)

  const session = await readSession(event)

  return {
    user: session.user ?? null,
    envs: {
      GITHUB_REPOSITORY_OWNER: owner,
      GITHUB_REPOSITORY_OWNER_TYPE: ownerType,
      GITHUB_REPOSITORY_NAME: name,
      GITHUB_CLIENT_ID: clientId,
      GITHUB_OAUTH_CALLBACK: oauthCallback,
      GITHUB_EXCLUDED_LABELS: excludedLabels,
      GITHUB_EXCLUDED_REPOSITORY_OWNERS: excludedRepositoryOwners,
    },
  }
})
