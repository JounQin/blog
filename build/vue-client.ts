import { sync as glob } from 'glob'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import PurgeCSSPlugin from 'purgecss-webpack-plugin'
import purgecssWhitelister from 'purgecss-whitelister'
import VueSSRClientPlugin from 'vue-server-renderer/client-plugin'
import webpack, { Configuration, WebpackPluginInstance } from 'webpack'
import merge from 'webpack-merge'
import { GenerateSW } from 'workbox-webpack-plugin'

import baseConfig from './base'
import { __DEV__ } from './config'

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const config: Configuration = merge.smart(baseConfig, {
  entry: {
    app: ['./src/entry-client.ts'],
  },
  target: 'web',
  optimization: {
    runtimeChunk: {
      name: 'manifest',
    },
    splitChunks: {
      cacheGroups: {
        vendors: {
          chunks: 'initial',
          name: 'vendors',
          test: /node_modules/,
        },
      },
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.VUE_ENV': JSON.stringify('client'),
      __SERVER__: false,
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.pug',
      filename: '__non_ssr_page__.html',
      minify: !__DEV__ && {
        minifyCSS: true,
        minifyJS: true,
      },
    }),
    new VueSSRClientPlugin({
      filename: '../vue-ssr-client-manifest.json',
    }),
  ],
})

if (!__DEV__) {
  config.plugins.push(
    new PurgeCSSPlugin({
      paths: glob('src/**/*', {
        nodir: true,
      }),
      safelist: purgecssWhitelister('node_modules/github-markdown-css/*.css'),
      blocklist: [],
    }) as WebpackPluginInstance,
    new GenerateSW({
      cacheId: 'blog',
      dontCacheBustURLsMatching: /\./,
      ignoreURLParametersMatching: [/index\.html$/, /\.map$/, /\.json$/],
      runtimeCaching: [
        {
          urlPattern: /^https?:\/\//,
          handler: 'NetworkFirst',
        },
      ],
    }),
  )
}

export default config
