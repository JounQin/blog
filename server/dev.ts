import _debug from 'debug'
import koaWebpack from 'koa-webpack'
import MFS from 'memory-fs'
import webpack, { Stats } from 'webpack'

import { resolve } from '../build/config'
import clientConfig from '../build/vue-client'
import serverConfig from '../build/vue-server'

const debug = _debug('1stg:server:dev')

export default (cb: (...args: unknown[]) => void) => {
  let _resolve: (value?: unknown) => void
  let clientManifest: unknown
  let bundle: unknown
  let fs: MFS

  // eslint-disable-next-line promise/param-names
  const readyPromise = new Promise(r => {
    _resolve = r
  })

  const ready = (...args: unknown[]) => {
    _resolve()
    // eslint-disable-next-line n/no-callback-literal
    cb(...args)
  }

  const clientCompiler = webpack(clientConfig)

  const webpackMiddlewarePromise = koaWebpack({
    compiler: clientCompiler,
  })

  // eslint-disable-next-line sonar/deprecation
  clientCompiler.plugin('done', (stats: Stats) => {
    const statsOutput = stats.toJson()
    // eslint-disable-next-line unicorn/no-array-for-each
    statsOutput.errors.forEach(debug)
    // eslint-disable-next-line unicorn/no-array-for-each
    statsOutput.warnings.forEach(debug)

    if (statsOutput.errors.length > 0) {
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    webpackMiddlewarePromise.then(webpackMiddleware => {
      fs = webpackMiddleware.devMiddleware.fileSystem
      clientManifest = JSON.parse(
        fs.readFileSync(resolve('dist/vue-ssr-client-manifest.json')) as string,
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
      mfs.readFileSync(resolve('dist/vue-ssr-server-bundle.json')) as string,
    )

    if (clientManifest) {
      ready({ bundle, clientManifest, fs })
    }
  })

  return { readyPromise, webpackMiddlewarePromise }
}
