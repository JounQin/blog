import type { BlogIssue } from '../../shared/types/blog'

import { ARCHIVES_QUERY } from '../utils/queries'
import { githubGraphql } from '../utils/github'
import { getDefaultLabels, getRepository } from '../utils/blog'

const MAX_PAGES = 20

interface ArchivesPage {
  nodes: BlogIssue[]
  pageInfo: {
    endCursor: string | null
    hasNextPage: boolean
  }
}

export default defineEventHandler(async event => {
  const repository = getRepository(event)
  const labels = await getDefaultLabels(event)

  const nodes: BlogIssue[] = []
  let after: string | null = null

  for (let page = 0; page < MAX_PAGES; page++) {
    const data: { repository: { issues: ArchivesPage } } = await githubGraphql(
      event,
      ARCHIVES_QUERY,
      {
        ...repository,
        after,
        labels,
      },
    )

    const issues = data.repository.issues

    nodes.push(...issues.nodes)

    const { endCursor, hasNextPage } = issues.pageInfo

    if (!hasNextPage || !endCursor) {
      break
    }

    after = endCursor
  }

  return { nodes }
})
