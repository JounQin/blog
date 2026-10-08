import type { H3Event } from 'h3'

import type { BlogLabel } from '../../shared/types/blog'

import { CATEGORIES_QUERY } from './queries'
import { githubGraphql } from './github'
import { getEnv } from './env'

export interface BlogConfig {
  owner: string
  name: string
  ownerType: string
  excludedLabels: string[]
  excludedRepositoryOwners: string[]
  clientId: string
  clientSecret: string
  oauthCallback: string
}

export const toList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(String).filter(Boolean)
    : String(value ?? '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)

/**
 * Environment variable names follow the legacy `env.js` / `.env.build` names
 * (`GITHUB_REPOSITORY_OWNER`, `GITHUB_CLIENT_ID`, ...) so existing deployments
 * keep working. `NUXT_`-prefixed values still work through `runtimeConfig`.
 */
export const getBlogConfig = (event: H3Event): BlogConfig => {
  const { github } = useRuntimeConfig(event)

  return {
    owner: getEnv(event, 'GITHUB_REPOSITORY_OWNER', github.owner),
    name: getEnv(event, 'GITHUB_REPOSITORY_NAME', github.name),
    ownerType: getEnv(event, 'GITHUB_REPOSITORY_OWNER_TYPE', github.ownerType),
    excludedLabels: toList(
      getEnv(event, 'GITHUB_EXCLUDED_LABELS', github.excludedLabels),
    ),
    excludedRepositoryOwners: toList(
      getEnv(
        event,
        'GITHUB_EXCLUDED_REPOSITORY_OWNERS',
        github.excludedRepositoryOwners,
      ),
    ),
    clientId: getEnv(event, 'GITHUB_CLIENT_ID', github.clientId),
    clientSecret: getEnv(event, 'GITHUB_CLIENT_SECRET', github.clientSecret),
    oauthCallback: getEnv(event, 'GITHUB_OAUTH_CALLBACK', github.oauthCallback),
  }
}

export const getRepository = (event: H3Event) => {
  const { owner, name } = getBlogConfig(event)

  return { owner, name }
}

export const getRepositoryLabels = async (
  event: H3Event,
): Promise<BlogLabel[]> => {
  const { repository } = await githubGraphql<{
    repository: { labels: { nodes: BlogLabel[] } }
  }>(event, CATEGORIES_QUERY, getRepository(event))

  return repository.labels.nodes
}

/** Same semantics as `getDefaultLabels` of the Vue 2 implementation. */
export const getDefaultLabels = async (event: H3Event): Promise<string[]> => {
  const { excludedLabels } = getBlogConfig(event)
  const excluded = new Set(excludedLabels)

  return (await getRepositoryLabels(event))
    .map(({ name }) => name)
    .filter(name => !excluded.has(name))
}

export const getStringQuery = (
  query: Record<string, unknown>,
  key: string,
): string => {
  const value = query[key]

  return typeof value === 'string' ? value.trim() : ''
}
