const path = require('path');
const execa = require('execa');
const rimraf = require('rimraf');
const gulp = require('gulp');
const concat = require('gulp-concat');
const less = require('gulp-less');

rimraf.sync(path.resolve(__dirname, '../dist'));

// concurrently \"rollup -c -w\" \"live-server --port=8099 --watch=demo,src,dist --open=demo\"
execa('concurrently', ['rollup -c -w', 'live-server --port=8999 --watch=demo,src,dist --open=demo'], {
  stdio: 'inherit'
});

function compileLess() {
  gulp.src('src/styles/**/*.less')
    .pipe(less())
    .pipe(concat('simpleCodeEditor.css'))
    .pipe(gulp.dest('dist'))
}

compileLess();

gulp.watch(['src/styles/**/*.less'], (cb) => {
  compileLess();
  cb();
})
