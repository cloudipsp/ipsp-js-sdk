var gulp     = require('gulp');
var concat   = require('gulp-concat');
var del      = require('del');
var uglify   = require('gulp-uglify');
var htmlToJs = require('gulp-html-to-js');


var combineFiles = function(name,deps,out){
    return gulp.src(deps).pipe(concat(name))
        .pipe(uglify())
        .pipe(gulp.dest(out));
};

gulp.task('views', function() {
    return gulp.src('src/html/**/*')
        .pipe(htmlToJs({concat: 'views.js',global:'$checkout.views'}))
        .pipe(gulp.dest('src'));
});

gulp.task('sdk',['views'],function(){
    return combineFiles('checkout.js',[
        'src/helpers.js',
        'src/index.js',
        'src/views.js'
    ],'dist');
});

gulp.task('clean', function() {
    return del.sync('dist');
});

gulp.task('watcher', function(){
    gulp.watch("src/*.js",['sdk']);
});

gulp.task('default', ['watcher','clean','sdk']);