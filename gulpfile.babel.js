import gulp from 'gulp';
import SocketIO from 'socket.io';
import del from 'del';
import requireDir from 'require-dir';
import args from './tasks/lib/args';
import { watchPort } from './package.json';

requireDir('./tasks');

gulp.task('clean', () => {
    return del([`dist/${args.vendor}/**/*`, `packages/*-${args.vendor}.*`]);
});

gulp.task(
    'build',
    gulp.series('clean', gulp.parallel('images', 'locales', 'scripts'), 'pack')
);

gulp.task(
    'watch',
    gulp.series('build', async function watch() {
        const io = SocketIO(watchPort);

        gulp.watch(
            'src/**/*',
            gulp.series('build', async function reload() {
                io.emit('reload', { vendor: args.vendor });
            })
        );
    })
);

gulp.task('default', gulp.series('build'));
