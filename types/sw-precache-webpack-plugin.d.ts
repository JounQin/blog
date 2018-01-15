declare module 'sw-precache-webpack-plugin' {
  import { Plugin } from 'webpack'

  interface SWPrecachePluginOptions {
    // plugin options
    dontCacheBustUrlsMatching?: RegExp
    filename?: string
    filepath?: string
    mergeStaticsConfig?: boolean
    minify?: boolean
    navigateFallback?: string
    staticFileGlobsIgnorePatterns?: RegExp[]
    runtimeCaching?: Array<{
      urlPattern: RegExp
      handler:
        | 'networkFirst'
        | 'cacheFirst'
        | 'fastest'
        | 'cacheOnly'
        | 'networkOnly'
      options?: any
    }>

    // sw-precache options
    cacheId?: string
    importScripts?: Array<
      | string
      | {
          chunkName?: string
          filename: string
        }
    >
    replacePrefix?: string
    staticFileGlobs?: string[]
    stripPrefix?: string
    stripPrefixMulti?: {
      [key: string]: string
    }
  }

  namespace SWPrecacheWebpackPlugin {

  }

  class SWPrecacheWebpackPlugin extends Plugin {
    constructor(options?: SWPrecachePluginOptions)
  }

  export = SWPrecacheWebpackPlugin
}
