import type { IssuesPayload } from '../../shared/types/blog'

import { ARTICLES_QUERY, SEARCH_QUERY } from '../utils/queries'
import { githubGraphql } from '../utils/github'
import {
  getDefaultLabels,
  getRepository,
  getStringQuery,
  toList,
} from '../utils/blog'

const PAGE_SIZE = 25

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const repository = getRepository(event)

  const requestedLabels = toList(query.labels)
  const search = getStringQuery(query, 'search')
  const before = getStringQuery(query, 'before') || null
  const after = getStringQuery(query, 'after') || null

  const labels = requestedLabels.length
    ? requestedLabels
    : await getDefaultLabels(event)

  // same paging rules as the Vue 2 implementation
  const first = (!(before || after) || after) ? PAGE_SIZE : null
  const last = before ? PAGE_SIZE : null

  if (search) {
    const { search: result } = await githubGraphql<{ search: IssuesPayload }>(
      event,
      SEARCH_QUERY,
      {
        first,
        last,
        before,
        after,
        search: `repo:${repository.owner}/${repository.name} is:issue is:open ${search}`,
      },
    )

    return result
  }

  const { repository: result } = await githubGraphql<{
    repository: { issues: IssuesPayload }
  }>(event, ARTICLES_QUERY, {
    ...repository,
    first,
    last,
    before,
    after,
    labels,
  })

  return result.issues
})
