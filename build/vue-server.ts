import VueSSRServerPlugin from 'vue-server-renderer/server-plugin'
import webpack, { Configuration } from 'webpack'
import merge from 'webpack-merge'
import nodeExternals from 'webpack-node-externals'

import baseConfig from './base'

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const config: Configuration = merge.smart(baseConfig, {
  entry: './src/entry-server.ts',
  target: 'node',
  output: {
    filename: 'server-bundle.js',
    libraryTarget: 'commonjs2',
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  externals: nodeExternals({
    allowlist: [/\.css$/],
  }),
  plugins: [
    new webpack.DefinePlugin({
      'process.env.VUE_ENV': JSON.stringify('server'),
      __SERVER__: true,
    }),
    new VueSSRServerPlugin({
      filename: '../vue-ssr-server-bundle.json',
    }),
  ],
})

export default config
