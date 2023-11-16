import gql from 'graphql-tag'
import { ActionContext, Store } from 'vuex'

import { Apollo, Repository, RootState } from 'types'

export const getCategoriesQueryOptions = (
  store: ActionContext<RootState, RootState> | Store<RootState>,
) => ({
  query: gql`
    query categories($name: String!, $owner: String!) {
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  variables: store.getters.REPOSITORY,
})

export const getDefaultLabels = ({
  apollo,
  store,
}: {
  apollo: Apollo
  store: Store<RootState>
}) =>
  apollo
    .readQuery<{
      repository: Repository
    }>(getCategoriesQueryOptions(store))
    .repository.labels.nodes.filter(
      label => !store.state.envs.GITHUB_EXCLUDED_LABELS.includes(label.name),
    )
