// @ts-check
import config from '@1stg/prettier-config/vue'

/** @type {import('prettier').Config} */
export default {
  ...config,
  overrides: [
    ...config.overrides,
    {
      files: '.env.*',
      excludeFiles: ['*.js'],
      options: {
        parser: 'sh',
      },
    },
  ],
}
