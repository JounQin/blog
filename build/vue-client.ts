import HtmlWebpackPlugin from 'html-webpack-plugin'
import OptimizeCssAssetsWebpackPlugin from 'optimize-css-assets-webpack-plugin'
import SWPrecacheWebpackPlugin from 'sw-precache-webpack-plugin'
import UglifyJsWebpackPlugin from 'uglifyjs-webpack-plugin'
import VueSSRClientPlugin from 'vue-server-renderer/client-plugin'
import webpack from 'webpack'
import merge from 'webpack-merge'

import { __DEV__, resolve } from './config'

import baseConfig from './base'

export default merge.smart(baseConfig, {
  entry: {
    app: ['./src/entry-client.ts'],
  },
  target: 'web',
  optimization: {
    minimizer: [
      new OptimizeCssAssetsWebpackPlugin(),
      new UglifyJsWebpackPlugin({
        cache: true,
        parallel: true,
      }),
    ],
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
    new SWPrecacheWebpackPlugin({
      cacheId: 'blog',
      minify: true,
      dontCacheBustUrlsMatching: /./,
      staticFileGlobsIgnorePatterns: [/index\.html$/, /\.map$/, /\.json$/],
      stripPrefix: resolve('dist').replace(/\\/g, '/'),
      runtimeCaching: [
        {
          urlPattern: /^https?\:\/\//,
          handler: 'networkFirst',
        },
      ],
    }),
  ],
})
