import gql from 'graphql-tag'
import { ActionContext, Store } from 'vuex'

import { Apollo, Repository, RootState } from 'types'

export const getCategoriesQueryOptions = (
  store: Store<RootState> | ActionContext<RootState, RootState>,
) => ({
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
