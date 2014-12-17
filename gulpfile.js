var gulp       = require('gulp')
,   gutil      = require('gulp-util')
,   jshint     = require('gulp-jshint')
,   stylish    = require('jshint-stylish')
,   nodemon    = require('gulp-nodemon')
,   source     = require('vinyl-source-stream')
,   browserify = require('browserify');


// Run test and lint.
gulp.task('test', ['lint'], function() {
  gulp.src('./test.js', { read: false })
    .pipe(mocha({ reporter: 'spec' }))
    .on('error', function(err) { return gutil.log(err.stack || err.message); });
});


// Lint.
gulp.task('lint', function() {
  return gulp.src(['qb.js'])
    .pipe(jshint({}))
    .pipe(jshint.reporter(stylish));
});


// Start API.
gulp.task('start', function() {
  nodemon({ script: 'example-api/app.js', ignore: ['node_modules/'] });
});


// Browserify example-app/app.js
gulp.task('bundle', function() {
  return browserify()
    .transform('jadeify')
    .add('./example-app/app.js')
    .bundle()
    .on('error', function(err) { 
    	gutil.log('Browserify error:', new Error(err)); 
    	this.emit('end');
    })
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./example-app'));
});


// Rebundle on change.
gulp.task('watch', function() {
	gulp.watch(['./example-app/app.js', './example-app/templates/*'], ['bundle', 'lint']);
});