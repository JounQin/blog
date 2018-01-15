declare module 'fork-ts-checker-webpack-plugin' {
  import { Plugin } from 'webpack'

  interface ForkTsCheckerPluginOptions {
    tsconfig?: string
    tslint?: string | true
    watch?: string | string[]
    async?: boolean
    vue?: boolean
  }

  namespace ForkTsCheckerWebpackPlugin {

  }

  class ForkTsCheckerWebpackPlugin extends Plugin {
    constructor(options?: ForkTsCheckerPluginOptions)
  }

  export = ForkTsCheckerWebpackPlugin
}
