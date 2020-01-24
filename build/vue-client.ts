import PurgecssWebpackPlugin from 'purgecss-webpack-plugin'
import purgecssWhitelister from 'purgecss-whitelister'
import VueSSRClientPlugin from 'vue-server-renderer/client-plugin'
import glob from 'glob'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { GenerateSW } from 'workbox-webpack-plugin'
import webpack from 'webpack'
import merge from 'webpack-merge'

import { __DEV__ } from './config'
import baseConfig from './base'

const config = merge.smart(baseConfig, {
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
      SERVER_PREFIX: JSON.stringify('/'),
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
    new PurgecssWebpackPlugin({
      paths: glob.sync('src/**/*', {
        nodir: true,
      }),
      whitelist: purgecssWhitelister('node_modules/github-markdown-css/*.css'),
    }),
    new GenerateSW({
      cacheId: 'blog',
      dontCacheBustUrlsMatching: /\./,
      ignoreUrlParametersMatching: [/index\.html$/, /\.map$/, /\.json$/],
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
