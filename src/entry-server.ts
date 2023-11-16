import _axios, { AxiosRequestHeaders, AxiosResponse } from 'axios'
import { LRUCache } from 'lru-cache'
import serialize from 'serialize-javascript'
import { createTranslator } from 'vue-translator'

import createApp from 'app'
import { createTranslate } from 'plugins'
import { Apollo, ServerContext, AsyncDataFn } from 'types'
import { DEFAULT_LOCALE, parseSetCookies } from 'utils'

const SET_COOKIE = 'set-cookie'

const KOA_SESS_SIG = 'koa:sess.sig'

const SCRIPT_SUFFIX = __DEV__
  ? ''
  : ';(function(){var s;(s=document.currentScript||document.scripts[document.scripts.length-1]).parentNode.removeChild(s);}())'

const cache = new LRUCache<string, Apollo>({
  max: 1000,
  ttl: 1000 * 60 * 15,
})

export default (context: ServerContext) =>
  // eslint-disable-next-line no-async-promise-executor, @typescript-eslint/no-misused-promises, sonarjs/cognitive-complexity
  new Promise(async (resolve, reject) => {
    const start: boolean | number = __DEV__ && Date.now()

    const { ctx, locale } = context

    const { app, createApollo, router, store } = createApp()

    const { url, headers } = ctx
    const { fullPath } = router.resolve(url).route

    if (fullPath !== url) {
      return reject(
        Object.assign(new Error('redirect'), { status: 302, url: fullPath }),
      )
    }

    const axios = _axios.create({ headers: headers as AxiosRequestHeaders })

    let apollo = cache.get(url)

    if (!apollo) {
      cache.set(url, (apollo = createApollo()))
    }

    const translator = createTranslator({
      locale,
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

        const cookies = headers[SET_COOKIE]

        for (const {
          name,
          expires,
          httponly: httpOnly,
          path,
          value,
        } of parseSetCookies(cookies)) {
          if (name !== KOA_SESS_SIG) {
            ctx.cookies.set(name, value, {
              expires: expires && new Date(expires),
              httpOnly,
              path,
            })
          }
        }

        return response
      },
      (e: { response: AxiosResponse }) => {
        console.error('error:', e)
        if (e.response) {
          ctx.set(e.response.headers)
        }
        reject(e.response || e)
      },
    )

    await store.dispatch('fetchInfo', { apollo, axios })

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    router.push(url)

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    router.onReady(async () => {
      const matched = router.getMatchedComponents()

      if (matched.length === 0) {
        console.error('no matched components')
        return reject(Object.assign(new Error('not found'), { status: 404 }))
      }

      const { currentRoute: route } = router

      if (route.fullPath !== url) {
        return reject(
          Object.assign(new Error('redirect'), {
            status: 302,
            url: route.fullPath,
          }),
        )
      }

      try {
        await Promise.all(
          matched.map(
            // @ts-expect-error
            ({
              options,
              asyncData = options?.asyncData,
            }: {
              options?: {
                asyncData?: AsyncDataFn
              }
              asyncData?: AsyncDataFn
            }) => asyncData?.({ apollo, axios, route, store, translate }),
          ),
        )
        await translate.cache.prefetch()
      } catch (e) {
        const err = e as {
          response?: AxiosResponse
        }
        return reject(err.response ? err.response.data : e)
      }

      if (__DEV__) {
        console.info(`data pre-fetch: ${Date.now() - start}ms`)
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
