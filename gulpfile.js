

var gulp       = require('gulp')
,   gutil      = require('gulp-util')
,   jshint     = require('gulp-jshint')
,   stylish    = require('jshint-stylish');


// Run test and lint.
gulp.task('test', ['lint'], function() {
  gulp.src('./test.js', { read: false })
    .pipe(mocha({ reporter: 'spec' }))
    .on('error', function(err) { return gutil.log(err.stack || err.message); });
});


// Lint test.
gulp.task('lint', function() {
  return gulp.src(['qb.js', 'test.js'])
    .pipe(jshint({}))
    .pipe(jshint.reporter(stylish));
});
