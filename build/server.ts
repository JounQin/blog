import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'

import baseConfig from './base'
import { resolve } from './config'

const config: webpack.Configuration = {
  ...baseConfig,
  entry: resolve('server/index.ts'),
  target: 'node',
  output: {
    path: resolve('dist'),
    filename: 'index.js',
    libraryTarget: 'commonjs2',
  },
  externals: nodeExternals({
    whitelist: [/\.css/],
  }),
  plugins: [
    new webpack.DefinePlugin({
      __SERVER__: true,
    }),
  ],
}

export default config
