import gulp from 'gulp';
import gulpif from 'gulp-if';
import args from './lib/args';
import { dynamicImport } from 'tsimportlib';

gulp.task('images', async () => {
    const imagemin = await dynamicImport('gulp-imagemin', module) as any;

    return gulp
        .src('src/images/**/*')
        .pipe(gulpif(args.production, imagemin.default()))
        .pipe(gulp.dest(`dist/${args.vendor}/images`));
});
