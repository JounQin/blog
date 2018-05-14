declare module 'purgecss-webpack-plugin' {
  import { Plugin } from 'webpack'

  namespace PurgecssWebpackPlugin {
    interface Options {
      paths: string[] | (() => string[])
      only?: string[]
      whitelist?: string[] | (() => string[])
      whitelistPatterns?: RegExp[] | (() => RegExp[])
    }
  }

  class PurgecssWebpackPlugin extends Plugin {
    constructor(options: PurgecssWebpackPlugin.Options)
  }

  export = PurgecssWebpackPlugin
}
