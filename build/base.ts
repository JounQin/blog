import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import { VueLoaderPlugin } from 'vue-loader'
import webpack, { Configuration, WebpackPluginInstance } from 'webpack'

import { DEFAULT_PORT, NODE_ENV, __DEV__, publicPath, resolve } from './config'

const sourceMap = __DEV__

const cssLoaders = (modules?: boolean) => [
  modules ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
  {
    loader: 'css-loader',
    options: {
      sourceMap,
      modules: modules && {
        exportLocalsConvention: 'camelCase',
        localIdentName: __DEV__
          ? '[name]__[local]___[hash:base64:5]'
          : '[hash:base64:10]',
      },
    },
  },
  {
    loader: 'postcss-loader',
    options: {
      sourceMap,
    },
  },
]

const scssLoaders = (modules?: boolean) => [
  ...cssLoaders(modules),
  'resolve-url-loader',
  {
    loader: 'sass-loader',
    options: {
      sourceMap: true,
      sassOptions: {
        includePaths: ['src', 'node_modules/bootstrap/scss'],
      },
      webpackImporter: false,
    },
  },
  {
    loader: 'style-resources-loader',
    options: {
      patterns: [
        'src/styles/_pre-variables.scss',
        ...['functions', 'variables', 'mixins'].map(
          item => `node_modules/bootstrap/scss/_${item}.scss`,
        ),
        'src/styles/_post-variables.scss',
      ],
    },
  },
]

const config: Configuration = {
  mode: NODE_ENV,
  output: {
    publicPath,
    path: resolve('dist/static'),
    filename: `[name].[${__DEV__ ? 'hash' : 'contenthash'}].js`,
  },
  resolve: {
    alias: {
      lodash$: 'lodash-es',
    },
    extensions: ['.ts', '.js'],
    modules: ['src', 'node_modules'],
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
        loader: 'url-loader',
        options: {
          limit: 5000,
        },
      },
      {
        test: /\.gql$/,
        loader: 'graphql-tag/loader',
      },
      {
        test: /\.pug$/,
        oneOf: [
          {
            resourceQuery: /^\?vue/,
            loader: 'pug-plain-loader',
          },
          {
            use: ['html-loader', 'pug-plain-loader'],
          },
        ],
      },
      {
        test: /\.css$/,
        oneOf: [
          {
            resourceQuery: /module/,
            use: cssLoaders(true),
          },
          {
            use: cssLoaders(),
          },
        ],
      },
      {
        test: /\.scss$/,
        oneOf: [
          {
            resourceQuery: /module/,
            use: scssLoaders(true),
          },
          {
            use: scssLoaders(),
          },
        ],
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\.vue$/],
          transpileOnly: true,
        },
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__,
      DEFAULT_PORT,
    }),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: resolve('src/tsconfig.json'),
        extensions: {
          vue: true,
        },
      },
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
    new VueLoaderPlugin() as WebpackPluginInstance,
  ],
}

export default config
