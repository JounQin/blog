import * as VueSSRServerPlugin from 'vue-server-renderer/server-plugin'
import * as webpack from 'webpack'
import * as merge from 'webpack-merge'
import * as nodeExternals from 'webpack-node-externals'

import { innerServer } from './config'

import baseConfig from './base'

export default merge.smart(baseConfig, {
  entry: './src/entry-server.ts',
  target: 'node',
  output: {
    filename: 'server-bundle.js',
    libraryTarget: 'commonjs2',
  },
  externals: nodeExternals({
    whitelist: [/\.css$/],
  }),
  plugins: [
    new webpack.DefinePlugin({
      'process.env.VUE_ENV': JSON.stringify('server'),
      SERVER_PREFIX: JSON.stringify(innerServer),
      __SERVER__: true,
    }),
    new VueSSRServerPlugin({
      filename: '../vue-ssr-server-bundle.json',
    }),
  ],
})
