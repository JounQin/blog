const fs = require('fs')
const { resolve } = require('path')

module.exports = {
  extends: '@1stg/eslint-config/recommended',
  settings: {
    node: {
      allowModules: fs.readdirSync('src').concat('app'),
      resolvePaths: [resolve('src')],
    },
    polyfills: ['navigator.serviceWorker'],
  },
  overrides: [
    {
      files: '*.ts',
      rules: {
        'promise/always-return': 0,
      },
    },
  ],
  rules: {
    '@typescript-eslint/camelcase': [
      2,
      {
        properties: 'never',
        ignoreDestructuring: true,
        allow: ['__non_webpack_require__'],
      },
    ],
  },
}
