declare module 'purgecss-webpack-plugin' {
  import { Plugin } from 'webpack'

  interface PurgecssWebpackPluginOptions {
    paths: string[]
  }

  namespace PurgecssWebpackPlugin {

  }

  class PurgecssWebpackPlugin extends Plugin {
    constructor(options: PurgecssWebpackPluginOptions)
  }

  export = PurgecssWebpackPlugin
}
