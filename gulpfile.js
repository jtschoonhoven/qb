
var Qb          = require('./lib')
,   fs          = require('fs')
,   gulp        = require('gulp')
,   mocha       = require('gulp-mocha')
,   gutil       = require('gulp-util')
,   jshint      = require('gulp-jshint')
,   stylish     = require('jshint-stylish')
,   nodemon     = require('gulp-nodemon')
,   source      = require('vinyl-source-stream')
,   browserify  = require('browserify')
,   definitions = require('./example-definitions');


// Lint.
gulp.task('lint', function() {
  return gulp.src(['./lib/*.js'])
    .pipe(jshint({}))
    .pipe(jshint.reporter(stylish));
});


// Test.
gulp.task('test', ['lint'], function () {
  return gulp.src('test/*.test.js', { read: false })
    .pipe(mocha({reporter: 'spec'}))
    .on('error', function(err) { return gutil.log(err.stack || err.message); });
});


// Retest on change.
gulp.task('watch-test', function() {
  gulp.watch(['qb.js', 'test/*.test.js'], ['test']);
});


// Start API.
gulp.task('start', function() {
  nodemon({ script: 'example-api/app.js', ignore: ['node_modules/'] });
});


// Create cached schema for use without Node server.
gulp.task('cache', function() {
  var qb = new Qb(definitions);
  var schema = JSON.stringify(qb.schema, null, 1);
  fs.writeFileSync('./example-app/cached-schema.json', schema);
});


// Browserify example-app/app.js
gulp.task('bundle', function() {
  return browserify({ debug: true })
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
gulp.task('watch', ['bundle'], function() {
	gulp.watch(['./example-app/app.js', './example-app/templates/*'], ['bundle']);
});