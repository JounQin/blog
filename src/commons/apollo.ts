import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import { ApolloClient } from 'apollo-client'

import { Repository } from 'types'
import { GITHUB_EXCLUDED_LABELS, REPOSITORY } from 'utils'

import * as querires from 'queries.gql'

export const getDefaultLabels = (apollo: ApolloClient<NormalizedCacheObject>) =>
  apollo
    .readQuery<{
      repository: Repository
    }>({
      query: querires.categories,
      variables: REPOSITORY,
    })
    .repository.labels.nodes.filter(
      label => !GITHUB_EXCLUDED_LABELS.includes(label.name),
    )
