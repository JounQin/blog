import { Apollo, Repository } from 'types'
import { GITHUB_EXCLUDED_LABELS, REPOSITORY } from 'utils'

import * as querires from 'queries.gql'

export const getDefaultLabels = (apollo: Apollo) =>
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
