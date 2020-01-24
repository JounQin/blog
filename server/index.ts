/* eslint-disable @typescript-eslint/no-magic-numbers */
import fs from 'fs'

import acceptLanguage from 'accept-language'
import proxy from 'koa-better-http-proxy'
import { BundleRenderer, createBundleRenderer } from 'vue-server-renderer'
import _debug from 'debug'
import Koa, { Middleware } from 'koa'
import compose from 'koa-compose'
import compress from 'koa-compress'
import logger from 'koa-logger'
import session from 'koa-session'
import staticCache from 'koa-static-cache'
import LRU from 'lru-cache'

import {
  resolve,
  runtimeRequire,
  serverHost,
  serverPort,
} from '../build/config'

import startRouter from './router'

import { INFINITY_DATE, LOCALES, LOCALE_COOKIE, TITLE } from 'utils'

acceptLanguage.languages(LOCALES)

const ACCEPT_LANGUAGE = 'Accept-Language'

const debug = _debug(
  `1stg:server${process.env.NODE_ENV === 'development' ? ':core' : ''}`,
)

const app = new Koa()

app.keys = (process.env.APP_KEYS || '').split(',')

let renderer: BundleRenderer
let ready: Promise<void>

const template: string =
  process.env.NODE_ENV === 'development'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require('pug') as typeof import('pug')).renderFile(
        resolve('server/template.pug'),
        {
          pretty: true,
        },
      )
    : fs.readFileSync(resolve('dist/template.html'), 'utf-8')

// https://github.com/vuejs/vue/blob/dev/packages/vue-server-renderer/README.md#why-use-bundlerenderer
const createRenderer = (bundle: object, options: object) =>
  createBundleRenderer(bundle, {
    ...options,
    template,
    inject: false,
    cache: new LRU({
      max: 1000,
      maxAge: 1000 * 60 * 15,
    }),
    basedir: resolve('dist/static'),
    runInNewContext: false,
  })

const middlewares: Koa.Middleware[] = [
  logger(),
  async (ctx, next) => {
    const { url } = ctx

    if (
      ctx.method !== 'GET' ||
      url.lastIndexOf('.') > url.lastIndexOf('/') ||
      !['*/*', 'text/html'].find(mimeType =>
        ctx.get('Accept').includes(mimeType),
      ) ||
      /^\/(api|graphql)($|\/)/.test(ctx.url)
    ) {
      return next()
    }

    await ready

    const start = Date.now()

    const originalLocale = ctx.cookies.get(LOCALE_COOKIE)

    const locale =
      originalLocale || acceptLanguage.get(ctx.get(ACCEPT_LANGUAGE))

    if (!originalLocale) {
      ctx.cookies.set(LOCALE_COOKIE, locale, {
        httpOnly: false,
        path: '/',
        expires: new Date(INFINITY_DATE),
      })
    }

    const context = { ctx, locale, title: TITLE }

    ctx.respond = false
    ctx.status = 200
    ctx.set({
      'Content-Type': 'text/html',
    })

    const { res } = ctx

    const stream = renderer
      .renderToStream(context)
      .on('error', (e: { status: number; url: string } & Error) => {
        switch ((ctx.status = e.status || 500)) {
          case 302:
            ctx.set({ Location: e.url })
            return res.end()
          case 401:
            ctx.redirect(`/login?next=${url}`)
            return res.end()
          case 404:
            return res.end('404 | Page Not Found')
          default:
            res.end('500 | Internal Server Error')
            debug(`error during render : ${url}`)
            console.error(e.stack)
        }
      })
      .on('end', () => {
        debug(`whole request: ${Date.now() - start}ms`)
      })

    stream.pipe(res)
  },
]

const MAX_AGE = 1000 * 3600 * 24 * 365 // one year

const publicStatic = staticCache('public', { maxAge: MAX_AGE })
const sessionMiddleware = session({}, app)

if (process.env.NODE_ENV === 'development') {
  const {
    readyPromise,
    webpackMiddlewarePromise,
  }: {
    readyPromise: Promise<void>
    webpackMiddlewarePromise: Promise<Middleware>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = require('./dev').default(
    ({ bundle, clientManifest }: { bundle: {}; clientManifest: {} }) => {
      renderer = createRenderer(bundle, {
        clientManifest,
      })
    },
  )

  ready = readyPromise

  middlewares.splice(
    1,
    0,
    publicStatic,
    sessionMiddleware,
    proxy(serverHost, {
      port: serverPort + 1,
      preserveReqSession: true,
      filter: ctx => ctx.url.startsWith('/api/'),
    }),
  )

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  webpackMiddlewarePromise.then(webpackMiddleware => app.use(webpackMiddleware))
} else {
  renderer = createRenderer(
    runtimeRequire(resolve('dist/vue-ssr-server-bundle.json')),
    {
      clientManifest: runtimeRequire(
        resolve('dist/vue-ssr-client-manifest.json'),
      ),
    },
  )

  const files: staticCache.Files = {}

  middlewares.splice(
    1,
    0,
    compress(),
    publicStatic,
    staticCache('dist/static', { maxAge: MAX_AGE }, files),
    sessionMiddleware,
    ...startRouter(app),
  )

  files['/service-worker.js'].maxAge = 0
}

middlewares.push(
  proxy('api.github.com/graphql', {
    filter: ctx => ctx.url === '/graphql',
    https: true,
    proxyReqOptDecorator(req, ctx) {
      req.headers.Authorization = `bearer ${ctx.session.token ||
        process.env.GITHUB_TOKEN}`
      return req
    },
  }),
)

app.use(compose(middlewares))

app.listen(serverPort, serverHost, () => {
  debug('Server is now running at %s:%s', serverHost, serverPort)
})
