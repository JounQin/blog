import createPostcssConfig from '@1stg/postcss-config'
import pxtorem from 'postcss-pxtorem'

const config = createPostcssConfig()

// NOTE: the options used to be passed to `require()` (a no-op), so pxtorem was
// running with its defaults. Kept as-is to keep the generated CSS identical.
config.plugins.push(pxtorem())

export default config
