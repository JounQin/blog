declare module 'google-fonts-webpack-plugin' {
  import { Plugin } from 'webpack'

  type FontFormat = 'eot' | 'woff' | 'woff2' | 'ttf' | 'svg'

  interface FontObject {
    family: string
    variants: string[]
    subsets: string[]
    formats?: FontFormat[]
  }

  interface GoogleFontsPluginOptions {
    fonts: FontObject[]
    name?: string
    filename?: string
    path?: string
    local?: boolean
    formats?: FontFormat[]
    apiUrl?: string
  }

  namespace GoogleFontsWebpackPlugin {

  }

  class GoogleFontsWebpackPlugin extends Plugin {
    constructor(options: GoogleFontsPluginOptions)
  }

  export = GoogleFontsWebpackPlugin
}
