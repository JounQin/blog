import axios from 'axios'
import Vue from 'vue'

import createApp from 'app'
import { apollo, translate } from 'plugins'
import { LOCALE_COOKIE, setCookie } from 'utils'

const { app, router, store } = createApp()

app.$watch('$t.locale', curr => {
  setCookie(LOCALE_COOKIE, curr, Infinity, '/')
})

app.$watch('$tt.loading', curr => {
  if (curr) {
    Vue.nextTick(() => translate.cache.prefetch())
  }
})

apollo.cache.restore(window.__APOLLO_CACHE__)
store.replaceState(window.__STORE_STATE__)

if (!__DEV__) {
  delete window.__APOLLO_CACHE__
  delete window.__STORE_STATE__
  delete window.__TRANSLATE_CACHE__
}

const SET_PROGRESS = 'SET_PROGRESS'

router.onReady(() => {
  router.beforeResolve(async (to, from, next) => {
    const matched = router.getMatchedComponents(to)
    const prevMatched = router.getMatchedComponents(from)

    if (!prevMatched) {
      return next()
    }

    let diffed = false

    const activated = matched.filter(
      (comp, index) => diffed || (diffed = prevMatched[index] !== comp),
    )

    store.commit(SET_PROGRESS, 70)

    if (activated.length) {
      await Promise.all(
        activated.map(
          ({ options, asyncData = options && options.asyncData }: any) =>
            asyncData &&
            asyncData({ apollo, axios, route: to, store, translate }),
        ),
      )
      await translate.cache.prefetch()
    }

    next()

    store.commit(SET_PROGRESS, 100)

    setTimeout(() => {
      store.commit(SET_PROGRESS, 0)
    }, 500)
  })

  app.$mount('#app')
})

if (module.hot) {
  module.hot.accept()
}

if (
  !__DEV__ &&
  (location.protocol === 'https:' ||
    ['127.0.0.1', 'localhost'].includes(location.hostname)) &&
  navigator.serviceWorker
) {
  navigator.serviceWorker.register('/service-worker.js')
}
