const gulp = require('gulp');
const lazyLoad = require('gulp-load-plugins')();
const webpack = require('webpack');
const eslint = require('gulp-eslint');
const replace = require('gulp-replace');
const gcb = require('gulp-callback');
const gutil = require("gulp-util");
const cleanCSS = require('gulp-clean-css');
const sassGlob = require('gulp-sass-glob');
const concat = require("gulp-concat");
const del = require('del');
const path = require('path');
const browserSync = require('browser-sync');

const GULP_CONFIG = {
    sourceRoot: './source',
    distRoot: './dist'
};

const webpackSettings = (build = false) => {
    return {
        entry: `${GULP_CONFIG.sourceRoot}/entry.js`,
        mode: build ? 'production' : 'development',
        devtool: '#source-map',
        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader'
                    }
                },
                {
                    test: /\.css$/,
                    use: [
                        'style-loader',
                        'css-loader'
                    ]
                }
            ]
        },
        resolve: {
            extensions: ['*', '.js', '.jsx', '.json']
        },
        output: {
            filename: 'bundle.js',
            sourceMapFilename: 'bundle.map',
            path: path.resolve(__dirname, `${GULP_CONFIG.distRoot}/assets/js`)
        }
    }
}

const externalCss = [
    './node_modules/normalize.css/normalize.css'
];

const errorHandler = title => {
    return error => {
        gutil.log(gutil.colors.red(`[${title}]`), error.toString());
        this.emit('end');
    };
};

const buildExternalStyles = (serve = false) => {
    let result = gulp.src(externalCss);
    if (!serve) {
        result = result.pipe(cleanCSS({ compatibility: 'ie9' }));
    }
    result = result.pipe(concat('external.css'))
        .pipe(gulp.dest(`${GULP_CONFIG.distRoot}/assets/css`));
    return result;
}

const buildStyles = (serve = false) => {
    let result = gulp.src(`${GULP_CONFIG.sourceRoot}/styles/common.scss`)
        .pipe(sassGlob())
        .pipe(lazyLoad.sourcemaps.init())
        .pipe(lazyLoad.sass({ style: 'expanded' })).on('error', errorHandler('Sass'))
        .pipe(lazyLoad.autoprefixer()).on('error', errorHandler('Autoprefixer'));
    if (!serve) {
        result = result.pipe(cleanCSS({ compatibility: 'ie9' }));
    }
    result = result.pipe(lazyLoad.sourcemaps.write())
        .pipe(concat('bundle.css'))
        .pipe(gulp.dest(`${GULP_CONFIG.distRoot}/assets/css`));
    return result;
};

const webpackBuild = (build = false) => {
    webpack(webpackSettings(build), (error, stats) => {
        if (error) throw new gutil.PluginError("Webpack", error);
    });
};

const addVersion = () => {
    return gulp.src(`${GULP_CONFIG.distRoot}/index.html`)
        .pipe(replace(new RegExp('.js"', 'g'), '.js?v=' + new Date().getTime() + '"'))
        .pipe(replace(new RegExp('.css"', 'g'), '.css?v=' + new Date().getTime() + '"'))
        .pipe(gulp.dest(GULP_CONFIG.distRoot));
};

gulp.task('clean', (callback) => del(GULP_CONFIG.distRoot, callback));

gulp.task('html', () => {
    return gulp.src(`${GULP_CONFIG.sourceRoot}/index.html`, { since: gulp.lastRun('html') })
        .pipe(gulp.dest(GULP_CONFIG.distRoot))
        .pipe(gcb(() => addVersion()));
});

gulp.task('fonts', () => {
    return gulp.src(`${GULP_CONFIG.sourceRoot}/assets/fonts/**/*.*`, { since: gulp.lastRun('fonts') })
        .pipe(gulp.dest(`${GULP_CONFIG.distRoot}/assets/fonts`));
});

gulp.task('images', () => {
    return gulp.src(`${GULP_CONFIG.sourceRoot}/assets/images/**/*.*`, { since: gulp.lastRun('images') })
        .pipe(gulp.dest(`${GULP_CONFIG.distRoot}/assets/images`));
});

gulp.task('files', () => {
    return gulp.src(`${GULP_CONFIG.sourceRoot}/assets/files/**/*.*`, { since: gulp.lastRun('files') })
        .pipe(gulp.dest(`${GULP_CONFIG.distRoot}/assets/files`))
});

gulp.task('external-styles', () => buildExternalStyles());

gulp.task('external-styles:serve', () => buildExternalStyles(true));

gulp.task('styles', () => {
    return buildStyles();
});

gulp.task('styles:serve', () => {
    return buildStyles(true)
        .pipe(browserSync.stream());
});

gulp.task('eslint', () => {
    return gulp.src([
        `${GULP_CONFIG.sourceRoot}/**/*.js`,
        `${GULP_CONFIG.sourceRoot}/**/*.jsx`
    ])
        .pipe(eslint())
        .pipe(eslint.format());
});

gulp.task('scripts', gulp.series('eslint', callback => {
    webpackBuild(true);
    return callback();
}));

gulp.task('scripts:serve', gulp.series('eslint', callback => {
    webpackBuild();
    return callback();
}));

gulp.task('build',
    gulp.series('clean', 
        gulp.parallel('html', 'fonts', 'images', 'external-styles', 'styles', 'scripts')
    )
);

gulp.task('build:serve',
    gulp.series('clean', 
        gulp.parallel('html', 'fonts', 'images', 'external-styles', 'styles:serve', 'scripts:serve')
    )
);

gulp.task('watch', () => {
    gulp.watch(`${GULP_CONFIG.sourceRoot}/index.html`, gulp.series('html'));
    gulp.watch(`${GULP_CONFIG.sourceRoot}/assets/images/**/*.*`, gulp.series('images'));
    gulp.watch(`${GULP_CONFIG.sourceRoot}/**/*.scss`, gulp.series('styles:serve'));
    gulp.watch(`${GULP_CONFIG.sourceRoot}/**/*.{js,jsx}`, gulp.series('scripts:serve'));
});

gulp.task('serve', () => {
    browserSync.init({
        open: true,
        server: GULP_CONFIG.distRoot
    });
    browserSync.watch([`${GULP_CONFIG.distRoot}/**/*.*`, '!**/*.css'], browserSync.reload);
});

gulp.task('development', 
    gulp.series('build:serve', 
        gulp.parallel('watch', 'serve')
    )
);

gulp.task('default', gulp.series('development'));