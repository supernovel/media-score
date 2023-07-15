import gulp from 'gulp';
import args from './lib/args';

gulp.task('fonts', () => {
  return gulp
    .src('src/**/*.{woff,woff2,ttf,eot,svg}')
    .pipe(gulp.dest(`dist/${args.vendor}/fonts`));
});
