// @ts-check

const config = require('@1stg/prettier-config/vue')

/**
 * @type {import('prettier').Config}
 */
module.exports = {
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
