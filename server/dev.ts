import _debug from 'debug'
import koaWebpack from 'koa-webpack'
import MFS from 'memory-fs'
import webpack from 'webpack'

import serverConfig from '../build/vue-server'
import clientConfig from '../build/vue-client'
import { resolve } from '../build/config'

const debug = _debug('1stg:server:dev')

export default (cb: (...args: unknown[]) => void) => {
  let _resolve: () => void
  let clientManifest: {}
  let bundle: {}
  let fs: MFS

  // eslint-disable-next-line promise/param-names
  const readyPromise = new Promise(r => {
    _resolve = r
  })

  const ready = (...args: unknown[]) => {
    _resolve()
    // eslint-disable-next-line standard/no-callback-literal
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

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
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
  serverCompiler.outputFileSystem = mfs

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
