declare module 'koa-static-cache' {
  import { Middleware } from 'koa'

  interface Files {
    [path: string]: Options
  }

  interface Options {
    dir?: string
    maxAge?: number
    cacheControl?: string
    buffer?: boolean
    gzip?: boolean
    usePrecompiledGzip?: boolean
    alias?: {}
    prefix?: string
    dynamic?: boolean
    filter?: (path: string) => boolean | string[]
    preload?: boolean
    files?: Files
  }

  namespace staticCache {
    type StaticCacheFiles = Files
    type StaticCacheOptions = Options
  }

  const staticCache: (
    dir: string | Options,
    options?: Options,
    files?: Files,
  ) => Middleware

  export = staticCache
}
