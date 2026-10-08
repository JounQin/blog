import type { ArticlePayload } from '../../../shared/types/blog'

import { ARTICLE_QUERY } from '../../utils/queries'
import { githubGraphql } from '../../utils/github'
import { getRepository } from '../../utils/blog'

export default defineEventHandler(async event => {
  const number = Number(getRouterParam(event, 'number'))

  if (!Number.isInteger(number) || number <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid article number',
    })
  }

  const { repository } = await githubGraphql<{
    repository: { issue: ArticlePayload | null }
  }>(event, ARTICLE_QUERY, { ...getRepository(event), number })

  if (!repository.issue) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }

  return repository.issue
})
