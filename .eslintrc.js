const fs = require('fs')

module.exports = {
  extends: '@1stg/eslint-config/recommended',
  settings: {
    node: {
      allowModules: fs.readdirSync('src').concat('app'),
    },
    polyfills: ['navigator.serviceWorker'],
  },
  rules: {
    '@typescript-eslint/no-unnecessary-condition': 0,
  },
}
