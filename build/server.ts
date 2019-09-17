import baseConfig from './base'
import { resolve } from './config'

import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'

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
    new webpack.DefinePlugin({
      __SERVER__: true,
    }),
  ],
}

export default config
