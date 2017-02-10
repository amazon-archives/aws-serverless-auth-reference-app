'use strict';

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();

var moduleName = 'aws-sign-web';

// Build the minified version
gulp.task('uglify', ['jshint', 'jscs'], function () {
    return gulp.src('./' + moduleName + '.js')
        .pipe(plugins.uglify({preserveComments: 'license'}))
        .pipe(plugins.rename(moduleName + '.min.js'))
        .pipe(gulp.dest('.'));
});

// Run the `jshint` utility
gulp.task('jshint', function () {
    return gulp.src('./' + moduleName + '.js')
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter());
});

// Run the `jscs` utility
gulp.task('jscs', function () {
    return gulp.src('./' + moduleName + '.js')
        .pipe(plugins.jscs())
        .pipe(plugins.jscs.reporter());
});

gulp.task('build', ['uglify']);
gulp.task('default', ['build']);
