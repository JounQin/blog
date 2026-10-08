import { getRepositoryLabels } from '../utils/blog'

export default defineEventHandler(async event => {
  const labels = await getRepositoryLabels(event)
  const { excludedLabels } = getBlogConfig(event)
  const excluded = new Set(excludedLabels)

  return {
    nodes: labels.filter(({ name }) => !excluded.has(name)),
  }
})
