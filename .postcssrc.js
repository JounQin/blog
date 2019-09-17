const config = require('@1stg/postcss-config')()

config.plugins.push(
  require('postcss-pxtorem', {
    rootValue: 14,
    propList: ['*'],
    selectorBlackList: ['html'],
    minPixelValue: 2,
  }),
)

module.exports = config
