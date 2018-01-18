import _axios from 'axios'
import { createTranslator } from 'vue-translator'

import { ServerContext } from 'types'
import { DEFAULT_LOCALE, parseSetCookies } from 'utils'

import createApp from 'app'

const SET_COOKIE = 'set-cookie'

const KOA_SESS_SIG = 'koa:sess.sig'

const SCRIPT_SUFFIX = __DEV__
  ? ''
  : ';(function(){var s;(s=document.currentScript||document.scripts[document.scripts.length-1]).parentNode.removeChild(s);}())'

export default (context: ServerContext) =>
  new Promise(async (resolve, reject) => {
    const start: boolean | number = __DEV__ && Date.now()

    const { ctx } = context

    const { app, router, store, apolloProvider } = createApp()

    const { url } = ctx
    const { fullPath } = router.resolve(url).route

    if (fullPath !== url) {
      return reject({ status: 302, url: fullPath })
    }

    const axios = _axios.create({
      headers: ctx.headers,
    })

    const translator = createTranslator({
      locale: context.locale,
      defaultLocale: DEFAULT_LOCALE,
    })

    context.translator = translator

    axios.interceptors.response.use(
      response => {
        const { headers } = response
        const cookies = headers[SET_COOKIE] as string[]

        if (cookies) {
          parseSetCookies(cookies).forEach(
            ({ name, expires, httponly: httpOnly, path, value }) => {
              if (name !== KOA_SESS_SIG) {
                ctx.cookies.set(name, value, {
                  expires: expires && new Date(expires),
                  httpOnly,
                  path,
                })
              }
            },
          )
        }

        return response
      },
      e => {
        const { data, headers } = e.response
        ctx.set(headers)
        reject(data)
      },
    )

    await store.dispatch('fetchInfo', axios)

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
        await Promise.all([
          ...matched.map(({ options }: any) => {
            const { asyncData } = options || { asyncData: null }
            return asyncData && asyncData({ axios, route, store })
          }),
          apolloProvider.prefetchAll(
            {
              route,
            },
            matched,
          ),
        ])
      } catch (e) {
        return reject(e.response ? e.response.data : e)
      }

      if (__DEV__) {
        // tslint:disable-next-line:no-console
        console.log(`data pre-fetch: ${Date.now() - (start as number)}ms`)
      }

      context.script = `<script>window.__INITIAL_STATE__=${JSON.stringify(
        store.state,
      )};${apolloProvider.exportStates() + SCRIPT_SUFFIX}</script>`

      resolve(app)
    }, reject)
  })
