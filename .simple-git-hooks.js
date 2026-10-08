// `@1stg/simple-git-hooks` ships as a transpiled ES module, so its hooks map
// lives under `default` -- exporting the module object itself made
// simple-git-hooks reject the config ("Config was not in correct format").
// Its pre-commit runs nano-staged; this repo keeps lint-staged with
// `.lintstagedrc.js`, so only that command is overridden.
const { default: config } = require('@1stg/simple-git-hooks')

module.exports = { ...config, 'pre-commit': 'npx lint-staged' }
