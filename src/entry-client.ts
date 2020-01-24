import axios from 'axios'
import Vue from 'vue'

import createApp from 'app'
import { apollo, translate } from 'plugins'
import { LOCALE_COOKIE, setCookie } from 'utils'
import { AsyncDataFn, Locale } from 'types'

const { app, router, store } = createApp()

app.$watch('$t.locale', (curr: Locale) => {
  setCookie(LOCALE_COOKIE, curr, Infinity, '/')
})

app.$watch('$tt.loading', (curr: boolean) => {
  if (curr) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    Vue.nextTick(translate.cache.prefetch)
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

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    store.commit(SET_PROGRESS, 70)

    if (activated.length > 0) {
      await Promise.all(
        activated.map(
          ({
            options,
            asyncData = options && options.asyncData,
          }: {
            options?: {
              asyncData?: AsyncDataFn
            }
            asyncData?: AsyncDataFn
          }) =>
            asyncData &&
            asyncData({ apollo, axios, route: to, store, translate }),
        ),
      )
      await translate.cache.prefetch()
    }

    next()

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
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
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  navigator.serviceWorker.register('/service-worker.js')
}
