import path from 'path';
import log from 'fancy-log';
import colors from 'ansi-colors';
import { get, set } from 'lodash';

const CONTENT_MANIFEST_PATH = 'content_scripts';
const CONTENT_SCRIPT_PREPIX = 'content';

/**
 * Get `content` entry from manifest.json(`content_scripts[number].js`)
 *
 * @param {Object} options
 * @param {Object} options.manifest manifest.json
 * @param {Object} options.entry    webpack entry object
 * @param {String} options.basePath manifest.json directory
 */
export default function getEntryToContent({ manifest, entry, basePath }) {
    const contents = get(manifest, CONTENT_MANIFEST_PATH);

    if (contents instanceof Array && contents.length) {
        contents.forEach((content, index) => {
            let scriptPaths = get(content, 'js');

            if (scriptPaths != null) {
                if (typeof scriptPaths === 'string') {
                    scriptPaths = [scriptPaths];
                }

                if (scriptPaths instanceof Array && scriptPaths.length) {
                    scriptPaths = scriptPaths.map(scriptPath => {
                        return path.resolve(basePath, scriptPath);
                    });

                    entry[`${CONTENT_SCRIPT_PREPIX}${index}`] = scriptPaths;
                    set(content, 'js', [
                        `{{${CONTENT_SCRIPT_PREPIX}${index}}}`
                    ]);
                }
            } else {
                log(
                    `getEntryToScript: ${colors.yellow(
                        `${CONTENT_MANIFEST_PATH}.${index}.js path does not exist.`
                    )}`
                );
            }
        });
    } else {
        log(
            `getEntryToScript: ${colors.yellow(
                `${CONTENT_MANIFEST_PATH} path does not exist.`
            )}`
        );
    }
}
