import Vue from 'vue'

import 'plugins'

import createRouter from 'router'
import createStore from 'store'

import App from 'views/App.vue'

export default () => {
  const router = createRouter()
  const store = createStore()

  const app = new Vue({
    router,
    store,
    render: h => h(App),
  })

  return { app, router, store }
}
