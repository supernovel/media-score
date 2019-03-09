import path from 'path';
import log from 'fancy-log';
import colors from 'ansi-colors';
import { get, set } from 'lodash';
import args from '../lib/args';

//DEV_LIBRARY => inject when development
const DEV_LIBRARY = [path.resolve(process.cwd(), 'lib/reload.ts')];
const BACKGROUND_MANIFEST_PATH = 'background.scripts';
const BACKGROUND_SCRIPT_NAME = 'background';

/**
 * Get `backgtround` entry from manifest.json(`background.scripts`)
 *
 * @param {Object} options
 * @param {Object} options.manifest manifest.json
 * @param {Object} options.entry    webpack entry object
 * @param {String} options.basePath manifest.json directory
 */
export default function getEntryToBackground({ manifest, entry, basePath }) {
    let scriptPaths = get(manifest, BACKGROUND_MANIFEST_PATH);

    if (scriptPaths != null) {
        if (typeof scriptPaths === 'string') {
            scriptPaths = [scriptPaths];
        }

        if (scriptPaths instanceof Array && scriptPaths.length) {
            scriptPaths = scriptPaths.map(scriptPath => {
                return path.resolve(basePath, scriptPath);
            });

            if (!args.production) {
                scriptPaths.push(...DEV_LIBRARY);
            }

            entry[BACKGROUND_SCRIPT_NAME] = scriptPaths;
            set(manifest, BACKGROUND_MANIFEST_PATH, [
                `{{${BACKGROUND_SCRIPT_NAME}}}`
            ]);
        }
    } else {
        log(
            `getEntryToScript: ${colors.yellow(
                `${BACKGROUND_MANIFEST_PATH} path does not exist.`
            )}`
        );
    }
}
