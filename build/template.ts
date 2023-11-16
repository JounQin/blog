import fs from 'node:fs'
import path from 'node:path'

import { minify } from 'html-minifier'
import pug from 'pug'

const result = minify(pug.renderFile('server/template.pug'), {
  collapseWhitespace: true,
  minifyCSS: true,
  minifyJS: true,
})

fs.writeFileSync(path.resolve('dist/template.html'), result)
