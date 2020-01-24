// eslint-disable-next-line unicorn/filename-case
declare module '@packtracker/webpack-plugin' {
  import { Plugin, Stats } from 'webpack'

  namespace PacktrackerWebpackPlugin {
    interface Options {
      project_token: string
      author?: string
      branch?: string
      commit?: string
      committed_at?: string
      excludeAssets?: Stats.StatsExcludeFilter
      fail_build?: boolean
      message?: string
      prior_commit?: string
      upload?: boolean
    }
  }

  class PacktrackerWebpackPlugin extends Plugin {
    constructor(options: PacktrackerWebpackPlugin.Options)
  }

  export = PacktrackerWebpackPlugin
}
