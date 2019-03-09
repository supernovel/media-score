/**
 * Get cmd args
 *
 * https://github.com/HaNdTriX/generator-chrome-extension-kickstart/blob/master/app/templates/tasks/lib/args.js
 */

const yargs = require('yargs');

const NODE_ENV = (process.env.NODE_ENV || '').replace(/[^a-z]/,'');
const VENDOR = (process.env.VENDOR || '').replace(/[^a-z]/,'');

const args = yargs
    .option('production', {
        boolean: true,
        default: NODE_ENV === 'production',
        describe: 'Minify all scripts and assets'
    })
    .option('watch', {
        boolean: true,
        default: false,
        describe: 'Watch all files and start a livereload server'
    })
    .option('verbose', {
        boolean: true,
        default: false,
        describe: 'Log additional data'
    })
    .option('vendor', {
        string: true,
        default: ['chrome', 'firefox', 'opera'].includes(VENDOR) ?  VENDOR : 'chrome',
        describe: 'Compile the extension for different vendors',
        choices: ['chrome', 'firefox', 'opera']
    })
    .option('sourcemaps', {
        describe: 'Force the creation of sourcemaps'
    }).argv;

// Use production flag for sourcemaps
// as a fallback
if (typeof args.sourcemaps === 'undefined') {
    args.sourcemaps = !args.production;
}

process.env.NODE_ENV = args.production ? 'production': 'development';
process.env.VENDOR = args.vendor;

module.exports = args;
