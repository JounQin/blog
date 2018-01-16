import * as ExtractTextPlugin from 'extract-text-webpack-plugin'
import * as ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import * as webpack from 'webpack'

import { __DEV__, publicPath, resolve } from './config'

const sourceMap = __DEV__
const minimize = !sourceMap

const config: webpack.Configuration = {
  output: {
    publicPath,
    path: resolve('dist/static'),
    filename: `[name].[${__DEV__ ? 'hash' : 'chunkhash'}].js`,
  },
  resolve: {
    alias: {
      'date-fns$': 'date-fns/esm',
      lodash$: 'lodash-es',
    },
    extensions: ['.ts', '.js'],
    modules: [resolve('src'), 'node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.(eot|ttf|woff2?)$/,
        loader: 'url-loader',
        options: {
          limit: 5000,
        },
      },
      {
        test: /\.(jpe?g|png|svg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 5000,
            },
          },
          'img-loader',
        ],
      },
      {
        test: /\.gql$/,
        loader: 'graphql-tag/loader',
      },
      {
        test: /\.pug$/,
        use: ['apply-loader', 'pug-loader'],
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\.vue$/],
          compilerOptions: {
            module: 'esnext',
          },
          transpileOnly: true,
        },
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          cssModules: {
            camelCase: true,
          },
          loaders: {
            scss: ExtractTextPlugin.extract({
              fallback: 'vue-style-loader',
              use: [
                {
                  loader: 'css-loader',
                  options: {
                    sourceMap,
                    minimize,
                  },
                },
                {
                  loader: 'postcss-loader',
                  options: {
                    sourceMap,
                    minimize,
                  },
                },
                {
                  loader: 'sass-loader',
                  options: {
                    sourceMap,
                    minimize,
                    includePaths: [resolve('node_modules/bootstrap/scss')],
                  },
                },
              ],
            }),
          },
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      ...Object.entries(process.env).reduce(
        (result, [key, value]) => {
          if (key !== 'VUE_ENV') {
            result[`process.env.${key}`] = JSON.stringify(value)
          }
          return result
        },
        {} as { [key: string]: string },
      ),
      __DEV__,
      API_PREFIX: JSON.stringify('/api'),
    }),
    new ExtractTextPlugin({
      filename: 'app.[contenthash].css',
      disable: __DEV__,
    }),
    new ForkTsCheckerWebpackPlugin({
      tsconfig: resolve('src/tsconfig.json'),
      tslint: true,
      vue: true,
    }),
    ...(__DEV__
      ? [new webpack.NamedChunksPlugin(), new webpack.NamedModulesPlugin()]
      : [new webpack.optimize.ModuleConcatenationPlugin()]),
  ],
}

export default config
