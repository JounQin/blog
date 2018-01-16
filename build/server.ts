import * as webpack from 'webpack'
import * as nodeExternals from 'webpack-node-externals'

import { resolve } from './config'

import baseConfig from './base'

const config: webpack.Configuration = {
  ...baseConfig,
  entry: resolve('server/index.ts'),
  target: 'node',
  output: {
    path: resolve('dist'),
    filename: 'server.js',
    libraryTarget: 'commonjs2',
  },
  externals: nodeExternals({
    whitelist: [/\.css/],
  }),
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      comments: false,
    }),
  ],
}

export default config
