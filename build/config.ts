import * as path from 'path'

export const NODE_ENV = process.env.NODE_ENV || 'development'

export const __DEV__ = NODE_ENV === 'development'

export const serverHost = 'localhost'

export const serverPort = 7000

export const publicPath = __DEV__ ? `http://${serverHost}:${serverPort}/` : '/'

export const innerServer = `http://localhost:${serverPort}/`

export const resolve = (...args: string[]) =>
  path.resolve(process.cwd(), ...args)

export const runtimeRequire =
  typeof __non_webpack_require__ === 'undefined'
    ? require
    : __non_webpack_require__
