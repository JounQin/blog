import fs from 'fs'
import path from 'path'

import { minify } from 'html-minifier'
import pug from 'pug'

const result = minify(pug.renderFile('server/template.pug'), {
  collapseWhitespace: true,
  minifyCSS: true,
  minifyJS: true,
})

fs.writeFileSync(path.resolve(__dirname, '../dist/template.html'), result)
