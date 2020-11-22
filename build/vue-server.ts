import VueSSRServerPlugin from 'vue-server-renderer/server-plugin'
import webpack from 'webpack'
import merge from 'webpack-merge'
import nodeExternals from 'webpack-node-externals'

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
      __SERVER__: true,
    }),
    new VueSSRServerPlugin({
      filename: '../vue-ssr-server-bundle.json',
    }),
  ],
})
