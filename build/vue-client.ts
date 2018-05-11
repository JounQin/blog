import HtmlWebpackPlugin from 'html-webpack-plugin'
import SWPrecacheWebpackPlugin from 'sw-precache-webpack-plugin'
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
  devtool: __DEV__ ? 'cheap-module-eval-source-map' : false,
  optimization: {
    runtimeChunk: {
      name: 'manifest',
    },
    splitChunks: {
      chunks: 'initial',
      name: 'vendors',
      cacheGroups: {
        vendors: {
          test: ({ context, request }: { context: string; request: string }) =>
            /node_modules/.test(context) && !/\.css$/.test(request),
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
    ...(__DEV__
      ? []
      : [
          new SWPrecacheWebpackPlugin({
            cacheId: 'blog',
            minify: true,
            dontCacheBustUrlsMatching: /./,
            staticFileGlobsIgnorePatterns: [
              /index\.html$/,
              /\.map$/,
              /\.json$/,
            ],
            stripPrefix: resolve('dist').replace(/\\/g, '/'),
            runtimeCaching: [
              {
                urlPattern: /\//,
                handler: 'networkFirst',
              },
            ],
          }),
        ]),
    new VueSSRClientPlugin({
      filename: '../vue-ssr-client-manifest.json',
    }),
  ],
})
