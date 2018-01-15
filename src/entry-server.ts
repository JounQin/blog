import _axios from 'axios'

import { ServerContext } from 'types'

import createApp from 'app'

const SET_COOKIE = 'set-cookie'

export default (context: ServerContext) =>
  new Promise(async (resolve, reject) => {
    const start: boolean | number = __DEV__ && Date.now()

    const { ctx } = context

    const { app, router, store } = createApp()

    const { url } = ctx
    const { fullPath } = router.resolve(url).route

    if (fullPath !== url) {
      return reject({ status: 302, url: fullPath })
    }

    const axios = _axios.create({
      headers: ctx.headers,
    })

    axios.interceptors.response.use(
      response => {
        const { headers } = response
        const setCookie = headers[SET_COOKIE]
        if (setCookie) {
          ctx.set({
            [SET_COOKIE]: setCookie,
          })
        }
        return response
      },
      e => {
        const { data, headers } = e.response
        ctx.set(headers)
        reject(data)
      },
    )

    await store.dispatch('fetchUser', axios)

    router.push(ctx.url)

    router.onReady(async () => {
      const matched = router.getMatchedComponents()

      if (!matched.length) {
        // tslint:disable-next-line:no-console
        console.error('no matched components')
        return reject({ status: 404 })
      }

      const { currentRoute: route } = router

      if (route.fullPath !== url) {
        return reject({ status: 302, url: route.fullPath })
      }

      try {
        await Promise.all(
          matched.map(({ options }: any) => {
            const { asyncData } = options || { asyncData: null }
            return asyncData && asyncData({ axios, route, store })
          }),
        )
      } catch (e) {
        return reject(e.response ? e.response.data : e)
      }

      if (__DEV__) {
        // tslint:disable-next-line:no-console
        console.log(`data pre-fetch: ${Date.now() - (start as number)}ms`)
      }

      context.state = store.state

      resolve(app)
    }, reject)
  })
