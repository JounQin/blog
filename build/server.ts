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
    filename: 'server.js',
    libraryTarget: 'commonjs2',
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  externals: nodeExternals({
    allowlist: [/\.css/],
  }),
  plugins: [
    new webpack.DefinePlugin({
      __SERVER__: true,
    }),
  ],
}

export default config
