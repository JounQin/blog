// pre-commit: fix the files that are staged with the Nuxt ESLint flat config
export default {
  '*.{js,mjs,cjs,ts,vue}': 'eslint --fix',
}
