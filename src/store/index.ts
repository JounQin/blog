import { AxiosInstance } from 'axios'
import Vue from 'vue'
import Vuex, { Action, Getter, Mutation } from 'vuex'

import { Apollo, Env, RootState, User } from 'types'
import { getCategoriesQueryOptions } from 'utils'

Vue.use(Vuex)

const getters: {
  [key: string]: Getter<RootState, RootState>
} = {
  REPOSITORY: state => ({
    name: state.envs.GITHUB_REPOSITORY_NAME,
    owner: state.envs.GITHUB_REPOSITORY_OWNER,
  }),
  LOGIN: state => ({
    login: state.envs.GITHUB_REPOSITORY_OWNER,
  }),
}

const actions: {
  [key: string]: Action<RootState, RootState>
} = {
  async fetchInfo(
    store,
    {
      apollo,
      axios,
    }: {
      apollo: Apollo
      axios: AxiosInstance
    },
  ) {
    const {
      data: { user, envs },
    } = await axios.get<{
      user: User
      envs: Env
    }>('/fetchInfo')

    store.commit('SET_USER', user)
    store.commit('SET_ENVS', envs)

    await apollo.query({ ...getCategoriesQueryOptions(store) })
  },
}

const mutations: {
  [key: string]: Mutation<RootState>
} = {
  SET_PROGRESS(state, progress: number) {
    state.progress = progress
  },
  SET_USER(state, user: User) {
    state.user = user
  },
  SET_ENVS(state, envs: Env) {
    state.envs = envs
  },
}

export default () =>
  new Vuex.Store<RootState>({
    state: {
      progress: 0,
      user: null,
      envs: null,
    },
    getters,
    actions,
    mutations,
  })
