var gulp     = require('gulp');
var concat   = require('gulp-concat');
var del      = require('del');
var uglify   = require('gulp-uglify');
var rename   = require('gulp-rename');
var wrap     = require('gulp-wrap');
var htmlToJs = require('gulp-html-to-js');
var sourcemaps = require('gulp-sourcemaps');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

gulp.task('views',function(){
    return gulp.src('src/html/**/*')
        .pipe(htmlToJs({concat:'index.js'}))
        //.pipe(wrap("$checkout.scope('Views',function(ns){\n<%=contents%>\n});"))
        .pipe(gulp.dest('src/views'));
});


gulp.task('build', function(){
    return browserify(['src/build.js'],{
        standalone: '$checkout'
    }).bundle()
      .pipe(source('ipsp.js'))
      .pipe(buffer())
      .pipe(gulp.dest('dist'))
      .pipe(sourcemaps.init())
      .pipe(uglify())
      .pipe(rename({extname:'.min.js'}))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('dist'));
});


gulp.task('sdk',function(){
    return gulp.src([
        'src/index.js',
        'src/views/*.js'
    ]).pipe(concat('checkout.js'))
    .pipe(wrap({src:'src/wrap/base.ejs'},{moduleName:'$checkout'}))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(rename({extname:'.min.js'}))
    .pipe(gulp.dest('dist'));
});

gulp.task('clean', function(done) {
    del.sync('dist');
    done();
});


gulp.task('watcher', function(){
    gulp.watch([
        'src/index.js',
        'src/build.js',
        'src/core/**/*.js',
        'src/html/*.ejs'
    ],gulp.series(['views','sdk','build']));
});

gulp.task('default',gulp.series(['clean','views','sdk']));