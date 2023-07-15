import gulp from 'gulp';
import path from 'path';
import webpack from 'webpack';
import log from 'fancy-log';
import colors from 'ansi-colors';
import fg from 'fast-glob';
import { merge } from 'lodash';
import { dynamicImport } from 'tsimportlib';

const TEST_PATH = path.resolve(__dirname, '../test');

gulp.task('test:clean', async () => {
  const { deleteSync } = (await dynamicImport(
    'del',
    module,
  )) as typeof import('del');

  return deleteSync([path.resolve(TEST_PATH, '*.b.js')]);
});

gulp.task(
  'test:build',
  gulp.series('test:clean', async () => {
    const testFiles = await fg.async(path.resolve(TEST_PATH, '*.ts'));
    const testEntry = {};

    testFiles.forEach((file) => {
      const basename = path.basename(file, '.ts');
      testEntry[`${basename}.b`] = file;
    });

    const webpackConfig = (await dynamicImport(
      '../webpack.config-test',
      module,
    )) as { default: webpack.Configuration };

    let config: webpack.Configuration = merge(webpackConfig.default, {
      entry: testEntry,
      output: {
        path: TEST_PATH,
        filename: '[name].js',
      },
    });

    await new Promise((resolve, reject) => {
      webpack(config, async (err, stats) => {
        if (err || stats?.hasErrors()) {
          log(
            `${colors.redBright('Error')} '${colors.cyan('scripts:test')}': ${
              err || stats?.toJson().errors
            }`,
          );
          reject(err || stats);
        } else {
          log(`Finished '${colors.cyan('scripts:test')}'`);
          resolve(null);
        }
      });
    });
  }),
);
