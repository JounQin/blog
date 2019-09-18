import path from 'path'

const DEV = 'development'
const PROD = 'production'

type NodeEnv = typeof DEV | typeof PROD

export const NODE_ENV: NodeEnv = (process.env.NODE_ENV || DEV) as NodeEnv

export const __DEV__ = NODE_ENV === 'development'

export const serverHost = '0.0.0.0'

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export const serverPort = +process.env.PORT || 7000

export const publicPath = '/'

export const innerServer = `http://localhost:${serverPort}/`

export const { resolve } = path

export const runtimeRequire =
  typeof __non_webpack_require__ === 'undefined'
    ? require
    : __non_webpack_require__
