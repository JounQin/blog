import * as GoogleFontsWebpackPlugin from 'google-fonts-webpack-plugin'
import * as HtmlWebpackPlugin from 'html-webpack-plugin'
import * as SWPrecacheWebpackPlugin from 'sw-precache-webpack-plugin'
import * as VueSSRClientPlugin from 'vue-server-renderer/client-plugin'
import * as webpack from 'webpack'
import * as merge from 'webpack-merge'

import { __DEV__, resolve } from './config'

import baseConfig from './base'

export default merge.smart(baseConfig, {
  entry: './src/entry-client.ts',
  target: 'web',
  devtool: __DEV__ ? 'cheap-module-eval-source-map' : false,
  plugins: [
    new webpack.DefinePlugin({
      'process.env.VUE_ENV': JSON.stringify('client'),
      SERVER_PREFIX: JSON.stringify('/'),
      __SERVER__: false,
    }),
    // extract vendor chunks for better caching
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendors',
      minChunks: module =>
        // a module is extracted into the vendors chunk
        // if it's inside node_modules
        /node_modules/.test(module.context) &&
        // and not a CSS file (due to extract-text-webpack-plugin limitation)
        !/\.css$/.test(module.request),
    }),
    // extract webpack runtime & manifest to avoid vendor chunk hash changing
    // on every build.
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.pug',
      favicon: 'src/assets/favicon.ico',
      filename: '__non_ssr_page__.html',
    }),
    ...(__DEV__
      ? []
      : [
          new GoogleFontsWebpackPlugin({
            fonts: [
              {
                family: 'Lato',
                variants: [
                  '300',
                  '300italic',
                  '400',
                  '400italic',
                  '700',
                  '700italic',
                ],
                subsets: ['latin', 'latin-ext'],
              },
            ],
          }),
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
