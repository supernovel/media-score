/**
 * 스크립트 번들 전에 manifest와 html파일로부터 처리할 엔트리 작성 및
 * manifest, html 템플릿 작성
 */

import { promises as fs } from 'fs';
import path from 'path';
import log from 'fancy-log';
import colors from 'ansi-colors';

import args from '../lib/args';
import template from '../lib/template';
import applyBrowserPrefixesFor from '../lib/applyBrowserPrefixesFor';

import packageJson from '../../package.json';
import manifestJson from '../../src/manifest.json';

import getEntryToPage from './page';
import getEntryToBackground from './background';
import getEntryToContent from './content';

const ENV = args.production ? 'production' : 'development';
const BASE_PATH = process.cwd();
const MANIFEST_PATH = path.resolve(BASE_PATH, 'src'); //manifest.json place

/**
 * Prepare scripts task
 *
 * @return {Object} {
 *      manifest,
 *      entry,
 *      popupHtml,
 *      optionsHtml
 * }
 */
export default async function preparingScripts() {
    try {
        try {
            //make vendor folder
            await fs.mkdir(path.resolve(BASE_PATH, `dist/${args.vendor}/`), {
                recursive: true
            });
        } catch (error) {
            log(`Error ${colors.cyan('manifest')} : ${error.message}`);
        }

        const entry = {};
        const entryMapping = {};
        let manifest = JSON.parse(
            template(JSON.stringify(manifestJson), packageJson)
        );

        manifest = applyBrowserPrefixesFor(args.vendor)(manifest);

        if (ENV === 'development') {
            manifest['content_security_policy'] =
                "script-src 'self' 'unsafe-eval'; object-src 'self'";
        }

        //Get webpack entry
        Object.assign(
            entryMapping, 
            getEntryToBackground({ manifest, entry, basePath: MANIFEST_PATH })
        );

        Object.assign(
            entryMapping, 
            getEntryToContent({ manifest, entry, basePath: MANIFEST_PATH })
        );

        //Get webpack entry and html
        const popupHtml = await getEntryToPage({
            manifest,
            entry,
            targetPath: 'browser_action.default_popup',
            targetName: 'popup',
            basePath: MANIFEST_PATH
        });
        const optionsHtml = await getEntryToPage({
            manifest,
            entry,
            targetPath: 'options_ui.page',
            targetName: 'options',
            basePath: MANIFEST_PATH
        });

        return {
            manifest: JSON.stringify(manifest),
            entry,
            entryMapping,
            popupHtml,
            optionsHtml
        };
    } catch (error) {
        log(
            `Error ${colors.cyan('manifest')} : ${colors.yellow(error.message)}`
        );

        return {};
    }
}
