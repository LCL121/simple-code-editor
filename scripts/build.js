const path = require('path');
const execa = require('execa');
const rimraf = require('rimraf');
const gulp = require('gulp');
const concat = require('gulp-concat');
const minifyCSS = require('gulp-minify-css');
const autoprefixer = require('gulp-autoprefixer');
const less = require('gulp-less');

rimraf.sync(path.resolve(__dirname, '../dist'));

execa('rollup', ['-c', '--env=build'], {
  stdio: 'inherit'
});

gulp.src('src/styles/**/*.less')
  .pipe(less())
  .pipe(minifyCSS())
  .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9'))
  .pipe(concat('simpleCodeEditor.min.css'))
  .pipe(gulp.dest('dist'))
