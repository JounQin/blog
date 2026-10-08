// @1stg/simple-git-hooks is a pure ES module, so the default import is the hooks
// map itself. Its pre-commit runs nano-staged while this repo keeps lint-staged
// with `.lintstagedrc.js`, so only that one command is overridden.
import hooks from '@1stg/simple-git-hooks'

export default { ...hooks, 'pre-commit': 'npx lint-staged' }
