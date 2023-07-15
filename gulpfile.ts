import * as gulp from "gulp";
import { Server } from 'socket.io';
import { watchPort } from './package.json';
import args from './tasks/lib/args';

import { dynamicImport } from 'tsimportlib';
import './tasks';

gulp.task('clean', async () => {
    const { deleteSync } = await dynamicImport('del', module) as typeof import('del');
    
    return deleteSync([`dist/${args.vendor}/**/*`, `packages/*-${args.vendor}.*`]);
});

gulp.task(
    'build',
    gulp.series('clean', gulp.parallel('images', 'locales', 'scripts'), 'pack')
);

gulp.task(
    'watch',
    gulp.series('build', async function watch() {
        const io = new Server();

        io.listen(parseInt(watchPort));

        gulp.watch(
            'src/**/*',
            gulp.series('build', async function reload() {
                io.emit('reload', { vendor: args.vendor });
            })
        );
    })
);

gulp.task('default', gulp.series('build'));