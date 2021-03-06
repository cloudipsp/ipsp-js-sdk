var gulp     = require('gulp');
var concat   = require('gulp-concat');
var del      = require('del');
var uglify   = require('gulp-uglify');
var rename   = require('gulp-rename');
var wrap     = require('gulp-wrap');
var htmlToJs = require('gulp-html-to-js');

gulp.task('views',function(){
    return gulp.src('src/html/**/*')
        .pipe(htmlToJs({concat:'index.js',global:'ns.views'}))
        .pipe(wrap("$checkout.scope('Views',function(ns){\n<%=contents%>\n});"))
        .pipe(gulp.dest('src/views'));
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
        'src/html/*.ejs'
    ],gulp.series(['views','sdk']));
});

gulp.task('default',gulp.series(['clean','views','sdk']));