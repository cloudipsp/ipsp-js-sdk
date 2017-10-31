var gulp     = require('gulp');
var concat   = require('gulp-concat');
var del      = require('del');
var uglify   = require('gulp-uglify');
var rename   = require('gulp-rename');
var wrap     = require('gulp-wrap');
var htmlToJs = require('gulp-html-to-js');


var combineFiles = function(name,deps,out){
    return gulp.src(deps).pipe(concat(name))
        .pipe(gulp.dest(out))
        .pipe(uglify())
        .pipe(rename({extname:'.min.js'}))
        .pipe(gulp.dest(out));
};

gulp.task('views', function() {
    return gulp.src('src/html/**/*')
        .pipe(htmlToJs({concat: 'views.js',global:'$checkout.views'}))
        .pipe(wrap('(function($){ <%= contents %> })(jQuery);'))
        .pipe(gulp.dest('src'));
});

gulp.task('sdk',['views'],function(){
    return combineFiles('checkout.js',[
        'src/index.js',
        'src/views.js'
    ],'dist');
});

gulp.task('clean', function() {
    return del.sync('dist');
});

gulp.task('watcher', function(){
    gulp.watch(['src/*.js','src/html/*.ejs'],['sdk']);
});

gulp.task('default', ['watcher','clean','sdk']);