import { AxiosInstance } from 'axios'
import Vue from 'vue'
import Vuex, { Action, Mutation } from 'vuex'

import { Repository, RootState, User } from 'types'
import { GITHUB_EXCLUDED_LABELS, REPOSITORY } from 'utils'

import * as querires from 'queries.gql'

Vue.use(Vuex)

const actions: {
  [key: string]: Action<RootState, RootState>
} = {
  async fetchInfo({ commit }, axios: AxiosInstance) {
    const [{ data: user }, { data }] = await Promise.all([
      axios.get<User>('/user'),
      Vue.apollo.query<{
        repository: Repository
      }>({
        query: querires.categories,
        variables: REPOSITORY,
      }),
    ])
    commit('SET_USER', user)
    commit(
      'SET_LABELS',
      data.repository.labels.nodes.filter(
        label => !GITHUB_EXCLUDED_LABELS.includes(label.name),
      ),
    )
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
  SET_ISSUES(state, issues) {
    state.issues = issues
  },
  SET_PAGE_INFO(state, pageInfo) {
    state.pageInfo = pageInfo
  },
  SET_ISSUE(state, issue) {
    state.issue = issue
  },
  SET_LABELS(state, labels) {
    state.labels = labels
  },
  SET_OWNER(state, owner) {
    state.owner = owner
  },
  SET_ARCHIVES(state, archives) {
    state.archives = archives
  },
  ADD_ARCHIVES(state, archives) {
    state.archives = [...state.archives, ...archives]
  },
}

export default () =>
  new Vuex.Store<RootState>({
    state: {
      archives: null,
      issue: null,
      issues: null,
      labels: null,
      owner: null,
      pageInfo: null,
      progress: 0,
      user: null,
    },
    actions,
    mutations,
  })
