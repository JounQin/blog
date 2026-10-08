import createPostcssConfig from '@1stg/postcss-config'
import pxtorem from 'postcss-pxtorem'

const config = createPostcssConfig()

config.plugins.push(
  pxtorem({
    rootValue: 14,
    propList: ['*'],
    selectorBlackList: ['html'],
    minPixelValue: 2,
  }),
)

export default config
