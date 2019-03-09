import { promises as fs } from 'fs';
import path from 'path';
import log from 'fancy-log';
import colors from 'ansi-colors';
import pug from 'pug';
import { get, set } from 'lodash';

const SCRIPT_REGEXP = /<script.*?src="(.*?)".*?<\/script>/g;

/**
 * Get `content` entry from manifest.json(`content_scripts[number].js`)
 *
 * @param {Object} options
 * @param {Object} options.manifest     manifest.json
 * @param {Object} options.entry        webpack entry object
 * @param {String} options.basePath     manifest.json directory
 * @param {String} options.targetPath   manifest.json page objet path
 * @param {String} options.targetName   manifest.json page result name
 */
export default async function getEntryToPage({
    manifest,
    entry,
    targetPath,
    targetName,
    basePath
}) {
    let pagePath = get(manifest, targetPath);

    try {
        if (pagePath == null) {
            throw new Error(`${targetPath} does not exist.`);
        } else {
            pagePath = path.resolve(basePath, pagePath);

            const pageDirName = path.dirname(pagePath);
            const pageExtName = path.extname(pagePath);
            const scriptPaths = [];

            // Read file
            
            let pageFile = preprocess(
                    await fs.readFile(pagePath, 'utf8'), 
                    pageExtName
                );
            let result, insertIndex;

            // Get script tag
            while ((result = SCRIPT_REGEXP.exec(pageFile)) !== null) {
                const length = result[0].length;
                const index = result.index;
                const scriptPath = result[1].trim();

                if (scriptPath) {
                    scriptPaths.push(path.resolve(pageDirName, scriptPath));

                    if (scriptPaths.length == 1) {
                        insertIndex = index;
                    }
                }

                // Remove script tag
                pageFile = `${pageFile.slice(0, index)}${pageFile.slice(index + length)}`;
            }

            // Mark script tag place
            pageFile = `${pageFile.slice(0, insertIndex)}{{${targetName}}}${pageFile.slice(
                insertIndex
            )}`;

            entry[targetName] = scriptPaths;
            set(manifest, targetPath, `${targetName}.html`);

            return pageFile;
        }
    } catch (error) {
        log(`getEntryToHTML: ${colors.yellow(error.message)}`);
    }
}

function preprocess(file, extName){
    switch(extName){
        case '.pug':
        case '.jade':
            return pug.render(file);
        default:
            return file;
    }
}