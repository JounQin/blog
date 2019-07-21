const config = {
  plugins: {
    autoprefixer: null,
    'postcss-pxtorem': {
      rootValue: 14,
      propList: ['*'],
      selectorBlackList: ['html'],
      minPixelValue: 2,
    },
  },
}

if (process.env.NODE_ENV === 'production') {
  config.plugins.cssnano = null
}

module.exports = config
