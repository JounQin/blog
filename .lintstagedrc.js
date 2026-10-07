// pre-commit: fix the files that are staged with the Nuxt ESLint flat config
module.exports = {
  '*.{js,mjs,cjs,ts,vue}': 'eslint --fix',
}
