import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import { ApolloClient } from 'apollo-client'
import { AxiosInstance } from 'axios'
import Vue from 'vue'
import Vuex, { Action, Mutation } from 'vuex'

import { RootState, User } from 'types'
import { REPOSITORY } from 'utils'

import * as querires from 'queries.gql'

Vue.use(Vuex)

const actions: {
  [key: string]: Action<RootState, RootState>
} = {
  async fetchInfo(
    { commit },
    {
      apollo,
      axios,
    }: { apollo: ApolloClient<NormalizedCacheObject>; axios: AxiosInstance },
  ) {
    const [{ data: user }] = await Promise.all([
      axios.get<User>('/user'),
      apollo.query({
        query: querires.categories,
        variables: REPOSITORY,
      }),
    ])
    commit('SET_USER', user)
  },
}

const mutations: {
  [key: string]: Mutation<RootState>
} = {
  SET_PROGRESS(state, progress) {
    state.progress = progress
  },
  SET_USER(state, user) {
    state.user = user
  },
}

export default () =>
  new Vuex.Store<RootState>({
    state: {
      progress: 0,
      user: null,
    },
    actions,
    mutations,
  })
