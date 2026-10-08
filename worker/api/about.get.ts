import type { OwnerProfile } from '../../shared/types/blog'

import { getPinnedRepositoriesQuery } from '../utils/queries'
import { githubGraphql } from '../utils/github'
import { getBlogConfig } from '../utils/blog'

/** Owner profile + pinned repositories (the "about" page). */
export default defineEventHandler(async event => {
  const { owner, ownerType } = getBlogConfig(event)
  const type = ownerType === 'organization' ? 'organization' : 'user'

  const data = await githubGraphql<Record<string, OwnerProfile>>(
    event,
    getPinnedRepositoriesQuery(type),
    { login: owner },
  )

  const profile = data[type]

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Owner not found' })
  }

  // pinned items can contain `null` (gists, or repositories the token cannot
  // read), which would break the template
  return {
    ...profile,
    pinnedItems: {
      nodes: (profile.pinnedItems?.nodes ?? []).filter(Boolean),
    },
  }
})
