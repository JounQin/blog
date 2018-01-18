import Vue from 'vue'
import VueApollo from 'vue-apollo'

import { apolloClient } from 'plugins'
import { invertColor, translateContent, translateTitle } from 'utils'

import createRouter from 'router'
import createStore from 'store'

import App from 'views/App.vue'

Object.defineProperty(Vue.prototype, '$utils', {
  value: {
    invertColor,
    translateContent,
    translateTitle,
  },
  writable: __DEV__,
})

export default () => {
  const router = createRouter()
  const store = createStore()

  const apolloProvider = new VueApollo({
    defaultClient: apolloClient,
  })

  const app = new Vue({
    router,
    store,
    apolloProvider,
    render: h => h(App),
  })

  return { app, router, store, apolloProvider }
}
