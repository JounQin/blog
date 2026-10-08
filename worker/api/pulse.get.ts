import type {
  PulseIssue,
  PulsePayload,
  PullRequestItem,
} from '../../shared/types/blog'

import { ISSUES_QUERY, PULL_REQUESTS_QUERY } from '../utils/queries'
import { githubGraphql } from '../utils/github'
import { getBlogConfig, getStringQuery } from '../utils/blog'

/**
 * Pull requests + issues of the repository owner (the "pulse" page).
 * `prAfter` / `iAfter` are the pagination cursors of each list.
 *
 * Nodes can be `null` when the token is not allowed to read a repository
 * (fine-grained tokens + organization policies), so they are filtered out
 * instead of breaking the whole page.
 */
export default defineEventHandler(async event => {
  const query = getQuery(event)
  const { owner, excludedRepositoryOwners } = getBlogConfig(event)
  const excluded = new Set(excludedRepositoryOwners)

  const [{ user: prUser }, { user: issueUser }] = await Promise.all([
    githubGraphql<{
      user: { pullRequests: PulsePayload<PullRequestItem> }
    }>(event, PULL_REQUESTS_QUERY, {
      login: owner,
      after: getStringQuery(query, 'prAfter') || null,
    }),
    githubGraphql<{ user: { issues: PulsePayload<PulseIssue> } }>(
      event,
      ISSUES_QUERY,
      {
        login: owner,
        after: getStringQuery(query, 'iAfter') || null,
      },
    ),
  ])

  const pullRequests = (prUser?.pullRequests?.nodes ?? [])
    .filter(
      (pr): pr is PullRequestItem =>
        !!pr?.repository?.owner?.login &&
        !excluded.has(pr.repository.owner.login),
    )
    .map(pr => ({ ...pr, isPr: true }))

  const issues = (issueUser?.issues?.nodes ?? []).filter(
    (issue): issue is PulseIssue =>
      !!issue?.repository?.owner?.login &&
      !excluded.has(issue.repository.owner.login),
  )

  return {
    pullRequests: {
      nodes: pullRequests,
      pageInfo: prUser?.pullRequests?.pageInfo ?? {
        endCursor: null,
        hasNextPage: false,
      },
    },
    issues: {
      nodes: issues,
      pageInfo: issueUser?.issues?.pageInfo ?? {
        endCursor: null,
        hasNextPage: false,
      },
    },
  }
})
