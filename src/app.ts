import Vue from 'vue'

import { createApollo } from 'plugins'
import { invertColor } from 'utils'
import createRouter from 'router'
import createStore from 'store'
import App from 'views/App.vue'

Object.defineProperty(Vue.prototype, '$utils', {
  value: {
    invertColor,
  },
  writable: __DEV__,
})

export default () => {
  const router = createRouter()
  const store = createStore()

  const app = new Vue({
    router,
    store,
    render: h => h(App),
  })

  return { app, createApollo, router, store }
}
