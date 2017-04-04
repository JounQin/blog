import gulp from 'gulp'
import postcss from 'posthtml-postcss'
import htmlmin from 'posthtml-minifier'
import autoprefixer from 'autoprefixer'
import cleancss from 'postcss-clean'
import _$ from 'gulp-load-plugins'
import del from 'del'

const $ = _$()

const app = {
  build: 'build'
}
const base = 'public/**/*.';

['css', 'js'].forEach(function (value) {
  app[value] = [`${base + value}`, `!${base}min.${value}`];
});

['html', 'xml'].forEach(function (value) {
  app[value] = `${base + value}`;
});

const clean = () => del(app.build)

const css = () => gulp.src(app.css)
  .pipe($.postcss([
    autoprefixer(),
    cleancss()]))
  .pipe(gulp.dest(app.build))

const js = () => gulp.src(app.js)
  .pipe($.uglify())
  .pipe(gulp.dest(app.build))

const html = () => gulp.src(app.html)
  .pipe($.posthtml([
    postcss([autoprefixer, cleancss]),
    htmlmin({
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      removeTagWhitespace: true
    })
  ]))
  .pipe(gulp.dest(app.build))

const xml = () => gulp.src(app.xml)
  .pipe($.xml({
    parseOpts: {
      trim: true
    },
    buildOpts: {
      renderOpts: {
        pretty: false
      },
      allowSurrogateChars: true,
      cdata: true
    },
    callback: function (result) {
      return result.replace(/\s{2,}/g, ' ');
    }
  }))
  .pipe(gulp.dest(app.build))

export default gulp.series(
  clean,
  gulp.parallel(css, js, html, xml)
)
