import gulp from 'gulp';
import args from './lib/args';

gulp.task('locales', () => {
    return gulp
        .src('src/_locales/**/*.json')
        .pipe(gulp.dest(`dist/${args.vendor}/_locales`));
});
