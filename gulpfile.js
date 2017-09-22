var gulp    = require('gulp');
var concat  = require('gulp-concat');
var uglify  = require('gulp-uglify');
var watch   = require('gulp-watch');
var del     = require('del');

var combineFiles = function(name,deps,out){
    return gulp.src(deps).pipe(concat(name))
        .pipe(uglify())
        .pipe(gulp.dest(out));
};

gulp.task('sdk', function(){
    return combineFiles('sdk.js',['./src/sdk.js'],'dist');
});

gulp.task('clean', function() {
    return del.sync('dist');
});

gulp.task('watcher', function(){
    gulp.watch("./src/*.js",['sdk']);
});

gulp.task('default', ['watcher','clean','sdk']);