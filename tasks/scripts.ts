import colors from 'ansi-colors';
import log from 'fancy-log';
import { promises as fs } from 'fs';
import gulp from 'gulp';
import { get, merge } from 'lodash';
import path from 'path';
import webpack from 'webpack';

import { dynamicImport } from 'tsimportlib';
import args from './lib/args';
import template from './lib/template';
import preparingScripts from './prepare';

const ENV = args.production ? 'production' : 'development';
const BASE_PATH = process.cwd();

gulp.task('scripts', async function scripts() {
    let { manifest, entry, popupHtml, optionsHtml } = await preparingScripts();
    
    const webpackConfig = await dynamicImport('../webpack.config', module) as {default: webpack.Configuration};

    // Make webpack config
    const config: webpack.Configuration = {
        ...merge(webpackConfig.default, {
            devtool: args.sourcemaps ? 'inline-source-map' : false,
            mode: ENV,
            context: path.resolve(BASE_PATH, 'src/'),
            entry: entry,
            output: {
                path: path.resolve(BASE_PATH, `dist/${args.vendor}/scripts`),
                chunkFilename: args.production ? '[chunkhash].js' : '[name].js'
            }
        })
    };

    if (config.plugins == undefined) {
        config.plugins = [];
    }

    // Set enviroment
    config.plugins.push(
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(ENV),
            'process.env.VENDOR': JSON.stringify(args.vendor)
        })
    );

    // Bundling
    const entryPoints = await new Promise((resolve, reject) => {
        webpack(config, async (err, stats) => {
            if (err || stats?.hasErrors()) {
                reject(err || stats);
            } else {
                log(
                    `Finished '${colors.cyan('scripts')}'`,
                    stats?.toString({
                        chunks: false,
                        colors: true,
                        cached: false,
                        children: false
                    })
                );

                resolve(
                    stats?.toJson({
                        chunks: true
                    }).entrypoints
                );
            }
        });
    });

    // Insert assets data into the (manifest.json, popup.html, options.html)
    if (entryPoints) {
        const entryKeys = Object.keys(entryPoints);
        const manifestData = {};

        entryKeys.forEach(key => {
            const assets = get(entryPoints, [key, 'assets']);

            if (key == 'popup' && popupHtml) {
                popupHtml = template(popupHtml, {
                    popup: assets.map(makeScriptTag).join('')
                });
            } else if (key == 'options' && optionsHtml) {
                optionsHtml = template(optionsHtml, {
                    options: assets.map(makeScriptTag).join('')
                });
            } else {
                manifestData[key] = assets.map(makeScriptString).join('","');
            }
        });

        manifest = template(manifest, manifestData);
    }

    // Write File (manifest.json, popup.html, options.html)
    return Promise.all([
        manifest
            ? fs.writeFile(
                  path.resolve(BASE_PATH, `dist/${args.vendor}/manifest.json`),
                  manifest
              )
            : Promise.resolve(),
        popupHtml
            ? fs.writeFile(
                  path.resolve(BASE_PATH, `dist/${args.vendor}/popup.html`),
                  popupHtml
              )
            : Promise.resolve(),
        optionsHtml
            ? fs.writeFile(
                  path.resolve(BASE_PATH, `dist/${args.vendor}/options.html`),
                  optionsHtml
              )
            : Promise.resolve()
    ]);
});

function makeScriptTag(src) {
    return `<script src="scripts/${src.name}"></script>`;
}

function makeScriptString(src) {
    return `scripts/${src.name}`;
}
