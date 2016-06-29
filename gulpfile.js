/**
 * Created by JounQin on 16/6/29.
 */
const gulp = require('gulp'),
    postcss = require('posthtml-postcss'),
    htmlmin = require('posthtml-minifier'),
    autoprefixer = require('autoprefixer'),
    cleancss = require('postcss-clean'),
    $ = require('gulp-load-plugins')();
del = require('del');

gulp.task('clean', function () {
    return del('./build');
});

gulp.task('css', ['clean'], function () {
    return gulp.src(['public/**/*.css', '!public/**/*.min.css'])
        .pipe($.postcss([
            autoprefixer({
                browsers: '> 90% in CN'
            }),
            cleancss()]))
        .pipe(gulp.dest('./build'));
});

gulp.task('js', ['clean'], function () {
    return gulp.src(['public/**/*.js', '!public/**/*.min.js'])
        .pipe($.uglify())
        .pipe(gulp.dest('./build'));
});

gulp.task('html', ['clean'], function () {
    return gulp.src('public/**/*.html')
        .pipe($.posthtml([
            postcss([
                autoprefixer({
                    browsers: '> 0% in CN'
                })]),
            htmlmin({
                collapseBooleanAttributes:true,
                collapseWhitespace: true,
                minifyCSS: true,
                minifyJS: true,
                removeTagWhitespace: true
            })
        ]))
        .pipe(gulp.dest('./build'));
});

gulp.task('default', ['css', 'js', 'html'], function () {
    console.log("gulp task finished!");
});