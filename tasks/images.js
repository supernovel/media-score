import gulp from 'gulp';
import gulpif from 'gulp-if';
import imagemin from 'gulp-imagemin';
import args from './lib/args';

gulp.task('images', () => {
    return gulp
        .src('src/images/**/*')
        .pipe(gulpif(args.production, imagemin()))
        .pipe(gulp.dest(`dist/${args.vendor}/images`));
});
