/**
 * Created by JounQin on 16/6/29.
 */
const gulp = require('gulp'),
    postcss = require('posthtml-postcss'),
    htmlmin = require('posthtml-minifier'),
    autoprefixer = require('autoprefixer'),
    cleancss = require('postcss-clean'),
    $ = require('gulp-load-plugins')(),
    del = require('del');

const app = {
        build: 'build'
    },
    base = 'public/**/*.';

['css', 'js', 'html'].forEach(function (value) {
    app[value] = [`${base + value}`, `!${base}min.${value}`];
});

function clean() {
    return del(app.build);
}

function css() {
    return gulp.src(app.css)
        .pipe($.postcss([
            autoprefixer(),
            cleancss()]))
        .pipe(gulp.dest(app.build));
}

function js() {
    return gulp.src(app.js)
        .pipe($.uglify())
        .pipe(gulp.dest(app.build));
}

function html() {
    return gulp.src(app.html)
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
        .pipe(gulp.dest(app.build));
}

gulp.task(clean);

gulp.task('default', gulp.series(
    clean,
    gulp.parallel(css, js, html)
));