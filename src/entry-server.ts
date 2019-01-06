import _axios from 'axios'
import LRU from 'lru-cache'
import serialize from 'serialize-javascript'
import { createTranslator } from 'vue-translator'

import { createTranslate } from 'plugins'
import { Apollo, ServerContext } from 'types'
import { DEFAULT_LOCALE, parseSetCookies } from 'utils'

import createApp from 'app'

const SET_COOKIE = 'set-cookie'

const KOA_SESS_SIG = 'koa:sess.sig'

const SCRIPT_SUFFIX = __DEV__
  ? ''
  : ';(function(){var s;(s=document.currentScript||document.scripts[document.scripts.length-1]).parentNode.removeChild(s);}())'

const cache = new LRU<string, Apollo>({
  max: 1000,
  maxAge: 1000 * 60 * 15,
})

export default (context: ServerContext) =>
  new Promise(async (resolve, reject) => {
    const start: boolean | number = __DEV__ && Date.now()

    const { ctx } = context

    const { app, createApollo, router, store } = createApp()

    const { url } = ctx
    const { fullPath } = router.resolve(url).route

    if (fullPath !== url) {
      return reject({ status: 302, url: fullPath })
    }

    const axios = _axios.create({
      headers: ctx.headers,
    })

    let apollo = cache.get(url)

    if (!apollo) {
      cache.set(url, (apollo = createApollo()))
    }

    const translator = createTranslator({
      locale: context.locale,
      defaultLocale: DEFAULT_LOCALE,
    })

    const translate = createTranslate(translator)

    Object.assign(context, {
      apollo,
      axios,
      translate,
      translator,
    })

    axios.interceptors.response.use(
      response => {
        const { headers } = response
        const cookies = headers[SET_COOKIE] as string[]

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

        return response
      },
      e => {
        const { data, headers } = e.response
        ctx.set(headers)
        reject(data)
      },
    )

    await store.dispatch('fetchInfo', { apollo, axios })

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
          matched.map(
            ({ options, asyncData = options && options.asyncData }: any) =>
              asyncData &&
              asyncData({ apollo, axios, route, store, translate }),
          ),
        )
        await translate.cache.prefetch()
      } catch (e) {
        return reject(e.response ? e.response.data : e)
      }

      if (__DEV__) {
        // tslint:disable-next-line:no-console
        console.log(`data pre-fetch: ${Date.now() - (start as number)}ms`)
      }

      context.script = `<script>window.__APOLLO_CACHE__=${serialize(
        apollo.cache.extract(),
        {
          isJSON: true,
        },
      )};window.__STORE_STATE__=${serialize(store.state, {
        isJSON: true,
      })};window.__TRANSLATE_CACHE__=${serialize(translate.cache.extract(), {
        isJSON: true,
      })}${SCRIPT_SUFFIX}</script>`

      resolve(app)
    }, reject)
  })
