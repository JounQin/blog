import Vue from 'vue'
import Vuex, { Action, Mutation } from 'vuex'

import { RootState } from 'types'

Vue.use(Vuex)

const actions: {
  [key: string]: Action<RootState, RootState>
} = {
  async fetchUser({ commit }, axios) {
    const { data: user } = await axios.get('/user')
    commit('SET_USER', user)
  },
}

const mutations: {
  [key: string]: Mutation<RootState>
} = {
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
      user: null,
    },
    actions,
    mutations,
  })
