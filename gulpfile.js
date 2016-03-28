var gulp = require('gulp'),
    gutil = require('gulp-util'),
    sass = require('gulp-sass'),
    fileinclude = require('gulp-file-include'),
    rename = require('gulp-rename'),
    notify = require('gulp-notify'),
    plumber = require('gulp-plumber'),
    autoprefixer = require('gulp-autoprefixer'),
    http = require('http'),
    st = require('st'),
    path = require("path"),
    source = require('vinyl-source-stream'),
    browserify = require('browserify'),
    tsify = require('tsify'),
    glob = require('glob');

var paths = {
    templates: './templates',
    sass: './scss',
    img: './img',
    lib: './lib',
    dst: './dist/',
    ts: './ts',
    typings: './typings'
};

function swallowError(error) {
    // If you want details of the error in the console
    console.log(error.toString());

    this.emit('end');
}

gulp.task('lib', function () {
    return gulp.src(path.join(paths.lib, '**/*.js'))
        .pipe(gulp.dest(paths.dst));
});

gulp.task('img', function () {
    return gulp.src(path.join(paths.img, '**/*.png'))
        .pipe(gulp.dest(paths.dst));
});

gulp.task('typescript', function () {
    var bundler = browserify({
        basedir: paths.ts,
        debug: true,
        paths: []
    });

    // Load all the definitions
    var definitions = glob.sync(paths.ts + "/definitions/**/*.d.ts");
    definitions.forEach(function (file) {
        file = file.replace(new RegExp("^" + paths.ts + "/"), '');
        bundler.add(file);
    });

    // Load the main script
    bundler.add('main.ts');

    bundler.plugin(tsify, {
        noImplicitAny: true
    });

    return bundler.bundle()
        .on('error', function (err) {
            console.log(err.toString());
            this.emit("end");
        })
        .pipe(source("script.js"))
        .pipe(gulp.dest(paths.dst));
});

gulp.task('fileinclude', function () {
    return gulp.src(path.join(paths.templates, '*.tpl.html'))
        .pipe(fileinclude())
        .on('error', swallowError)
        .pipe(rename({
            extname: ""
        }))
        .pipe(rename({
            extname: ".html"
        }))
        .pipe(gulp.dest(paths.dst))
        .pipe(notify({message: 'Includes: included'}));
});

gulp.task('sass', function () {
    return gulp.src(path.join(paths.sass, '*.scss'))
        .pipe(sass({
            style: 'expanded',
            sourceComments: 'map',
            errLogToConsole: true
        }))
        .on('error', swallowError)
        .pipe(autoprefixer('last 2 version', "> 1%", 'ie 8', 'ie 9'))
        .on('error', swallowError)
        .pipe(gulp.dest(paths.dst))
        .pipe(notify({message: 'LibSass files dropped!'}));
});

gulp.task('watch', function () {
    gulp.watch(path.join(paths.lib, '**/*'), ['lib']);
    gulp.watch(path.join(paths.img, '**/*'), ['img']);
    gulp.watch(path.join(paths.ts, '**/*.ts'), ['typescript']);
    gulp.watch(path.join(paths.typings, '**/*.d.ts'), ['typescript']);
    gulp.watch(path.join(paths.sass, '**/*.scss'), ['sass']);
    gulp.watch(path.join(paths.templates, '**/*.html'), ['fileinclude']);

});

gulp.task('server', function (done) {
    http.createServer(
        st({path: paths.dst, index: 'index.html', cache: false})
    ).listen(8080, done);

    console.log("Listening to http://localhost:8080/");
});

gulp.task('default', ['lib', 'img', 'typescript', 'fileinclude', 'sass', 'server', 'watch'], function () {

});
