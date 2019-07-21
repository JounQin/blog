import _debug from 'debug'
import koaWebpack from 'koa-webpack'
import MFS from 'memory-fs'
import webpack from 'webpack'

import { resolve } from '../build/config'

import clientConfig from '../build/vue-client'
import serverConfig from '../build/vue-server'

const debug = _debug('1stg:server:dev')

export default (cb: any) => {
  let _resolve: any
  let clientManifest: any
  let bundle: any
  let fs: MFS

  const readyPromise = new Promise(r => {
    _resolve = r
  })

  const ready = (...args: any[]) => {
    _resolve()
    cb(...args)
  }

  const clientCompiler = webpack(clientConfig)

  const webpackMiddlewarePromise = koaWebpack({
    compiler: clientCompiler,
  })

  clientCompiler.plugin('done', stats => {
    stats = stats.toJson()
    stats.errors.forEach(debug)
    stats.warnings.forEach(debug)

    if (stats.errors.length) {
      return
    }

    webpackMiddlewarePromise.then(webpackMiddleware => {
      fs = webpackMiddleware.devMiddleware.fileSystem
      clientManifest = JSON.parse(
        fs.readFileSync(resolve('dist/vue-ssr-client-manifest.json')),
      )

      if (bundle) {
        ready({ bundle, clientManifest, fs })
      }
    })
  })

  const mfs = new MFS()
  const serverCompiler = webpack(serverConfig)
  serverCompiler.outputFileSystem = mfs as any

  serverCompiler.watch({}, (err, stats) => {
    if (err) {
      throw err
    }

    if (stats.hasErrors()) {
      return
    }

    bundle = JSON.parse(
      mfs.readFileSync(resolve('dist/vue-ssr-server-bundle.json')),
    )

    if (clientManifest) {
      ready({ bundle, clientManifest, fs })
    }
  })

  return { readyPromise, webpackMiddlewarePromise }
}
