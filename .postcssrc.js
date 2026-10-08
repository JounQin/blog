// NOTE: not loaded by the Nuxt 4 build. `@nuxt/vite-builder` sets
// `vite.css.postcss` explicitly and composes its plugins from `nuxt.config.ts`
// alone, so Vite never looks for this file and `pxtorem` below is currently
// inactive (`font-size: 12px` still ships as `12px`). PostCSS plugins belong in
// `nuxt.config.ts` -> `vite.css.postcss.plugins`; whether to re-enable the
// px -> rem conversion is still an open decision.
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
