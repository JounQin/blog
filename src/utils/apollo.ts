import gql from 'graphql-tag'

import { Apollo, Repository } from 'types'

import { GITHUB_EXCLUDED_LABELS, REPOSITORY } from './constant'

export const categoriesQueryOptions = {
  query: gql`
    query($name: String!, $owner: String!) {
      repository(name: $name, owner: $owner) {
        labels(first: 100) {
          nodes {
            color
            id
            name
          }
        }
      }
    }
  `,
  variables: REPOSITORY,
}

export const getDefaultLabels = (apollo: Apollo) =>
  apollo
    .readQuery<{
      repository: Repository
    }>({ ...categoriesQueryOptions })
    .repository.labels.nodes.filter(
      label => !GITHUB_EXCLUDED_LABELS.includes(label.name),
    )
