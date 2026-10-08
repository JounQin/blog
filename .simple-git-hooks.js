// `@1stg/simple-git-hooks` ships as a CommonJS transpiled ES module, so the
// hooks map lives under `default`. Its pre-commit runs nano-staged while this
// repo keeps lint-staged with `.lintstagedrc.js`, so only that one is overridden.
import hooks from '@1stg/simple-git-hooks'

export default { ...(hooks.default || hooks), 'pre-commit': 'npx lint-staged' }
