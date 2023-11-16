import path from 'path'

const DEV = 'development'
const PROD = 'production'

type NodeEnv = typeof DEV | typeof PROD

export const NODE_ENV: NodeEnv = (process.env.NODE_ENV || DEV) as NodeEnv

export const __DEV__ = NODE_ENV === DEV

export const __PROD__ = NODE_ENV === PROD

export const serverHost = process.env.HOST || '0.0.0.0'

export const DEFAULT_PORT = 3000

export const serverPort = +process.env.PORT || DEFAULT_PORT

export const publicPath = '/'

// eslint-disable-next-line @typescript-eslint/unbound-method
export const { resolve } = path

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const runtimeRequire: NodeRequire =
  typeof __non_webpack_require__ === 'undefined'
    ? require
    : __non_webpack_require__
