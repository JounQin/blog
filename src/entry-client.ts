import axios from 'axios'
import Vue from 'vue'

import createApp from 'app'
import { translate } from 'plugins'
import { LOCALE_COOKIE, setCookie } from 'utils'

const { app, createApollo, router, store } = createApp()

const apollo = createApollo()

app.$watch('$t.locale', curr => {
  setCookie(LOCALE_COOKIE, curr, Infinity, '/')
})

app.$watch('$tt.loading', curr => {
  if (curr) {
    Vue.nextTick(() => {
      translate.cache.prefetch()
    })
  }
})

store.replaceState(window.__INITIAL_STATE__)

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
            asyncData({
              apollo,
              axios,
              route: to,
              store,
              translate,
              translator: Vue.translator,
            }),
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
  process.env.NODE_ENV === 'production' &&
  (location.protocol === 'https:' ||
    ['127.0.0.1', 'localhost'].includes(location.hostname)) &&
  navigator.serviceWorker
) {
  navigator.serviceWorker.register('/service-worker.js')
}
