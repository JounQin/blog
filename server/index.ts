import * as fs from 'fs'

import * as _debug from 'debug'
import * as Koa from 'koa'
import * as proxy from 'koa-better-http-proxy'
import * as compose from 'koa-compose'
import * as compress from 'koa-compress'
import * as logger from 'koa-logger'
import * as session from 'koa-session'
import * as staticCache from 'koa-static-cache'
import * as LRU from 'lru-cache'
import { BundleRenderer, createBundleRenderer } from 'vue-server-renderer'

import { __DEV__, resolve, serverHost, serverPort } from '../build/config'

import startRouter from './router'

const { APP_KEYS, GITHUB_TOKEN } = process.env

const debug = _debug(`1stg:server${__DEV__ ? ':core' : ''}`)

const app = new Koa()

app.keys = APP_KEYS.split(',')

let renderer: BundleRenderer
let ready: Promise<any>
// tslint:disable-next-line no-unused-variable
let mfs: any

const template = __DEV__
  ? // tslint:disable-next-line:no-var-requires
    require('pug').renderFile(resolve('server/template.pug'), {
      pretty: true,
    })
  : fs.readFileSync(resolve('dist/template.html'), 'utf-8')

// https://github.com/vuejs/vue/blob/dev/packages/vue-server-renderer/README.md#why-use-bundlerenderer
const createRenderer = (bundle: object, options: object) =>
  createBundleRenderer(bundle, {
    ...options,
    template,
    cache: LRU({
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

    const context = { ctx, title: 'GraphQL study' }

    ctx.respond = false
    ctx.status = 200
    ctx.set({
      'Content-Type': 'text/html',
    })

    const { res } = ctx

    const stream = renderer
      .renderToStream(context)
      .on('error', (e: { status: number; url: string; stack: any }) => {
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
            // tslint:disable-next-line:no-console
            console.error(e.stack)
        }
      })
      .on('end', () => {
        debug(`whole request: ${Date.now() - start}ms`)
      })

    stream.pipe(res)
  },
]

const sessionMiddleware = session({}, app)

if (__DEV__) {
  // tslint:disable-next-line:no-var-requires
  const { readyPromise, webpackMiddleware } = require('./dev').default(
    // tslint:disable-next-line:no-shadowed-variable
    ({ bundle, clientManifest, fs }: any) => {
      mfs = fs
      renderer = createRenderer(bundle, {
        clientManifest,
      })
    },
  )

  ready = readyPromise

  middlewares.splice(
    1,
    0,
    sessionMiddleware,
    webpackMiddleware,
    proxy(serverHost, {
      port: serverPort + 1,
      preserveReqSession: true,
      filter: ctx => /^\/api\//.test(ctx.url),
    }),
  )
} else {
  mfs = fs

  renderer = createRenderer(
    // tslint:disable-next-line:no-var-requires
    require(resolve('dist/vue-ssr-server-bundle.json')),
    {
      // tslint:disable-next-line:no-var-requires
      clientManifest: require(resolve('dist/vue-ssr-client-manifest.json')),
    },
  )

  const MAX_AGE = 1000 * 3600 * 24 * 365 // one year

  const files: staticCache.StaticCacheFiles = {}

  middlewares.splice(
    1,
    0,
    compress(),
    staticCache(
      resolve('dist/static'),
      {
        maxAge: MAX_AGE,
      },
      files,
    ),
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
      req.headers.Authorization = `bearer ${ctx.session.token || GITHUB_TOKEN}`
      return req
    },
  }),
)

app.use(compose(middlewares))

app.listen(serverPort, serverHost, () => {
  debug('Server is now running at %s:%s', serverHost, serverPort)
})
