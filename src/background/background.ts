import { browser } from 'webextension-polyfill-ts';
import { get } from 'lodash-es';

import getInfo from './info';
import { default as getScore, applyLocale} from './score';

const LanguageTag:{ [langCode:string]: string } = {
    'en': 'en-US',
    'ko': 'ko-KR',
    'ja': 'ja-JP',
};

(() => {
    const locale = LanguageTag[browser.i18n.getUILanguage()];
    applyLocale(locale);

    browser.runtime.onConnect.addListener(async port => {
        if (port.name != 'media_score') {
            return;
        }

        if(port.sender){
            const id = get(port.sender, 'tab.id');

            browser.tabs.executeScript(id, {
                file: '/scripts/ScoreBar.js'
            });
        }

        port.onMessage.addListener(
            async (
                message: MediaInfo,
                port
            ) => {
                console.debug(`BG page received message ${message} from ${port}`);

                const cacheKey = `${message.serviceName}_${message.id}`;

                try {
                    let cached = await browser.storage.local.get(cacheKey),
                        cachedValue = cached[cacheKey];

                    if (cachedValue) {
                        console.debug(`found: ${cacheKey}`, cachedValue);
                        cachedValue = JSON.parse(cachedValue);
                        return port.postMessage(cachedValue);
                    } else {
                        throw Error('not found');
                    }
                } catch (error) {
                    console.debug(
                        `found error: ${cacheKey}, error: ${error.message}`
                    );
                }

                const mediaInfo: MediaInfo = await getInfo(message);
                const scoreInfos: ScoreInfos = await getScore(mediaInfo);
                const scoreMessage = {
                    id: message.id,
                    data: scoreInfos
                }

                try {
                    await browser.storage.local.set({
                        [cacheKey]: JSON.stringify(scoreMessage)
                    });

                    console.debug(`store done: ${cacheKey}`);
                } catch (error) {
                    console.debug(
                        `store fail: ${cacheKey}, error: ${error.message}`
                    );
                }

                return port.postMessage(scoreMessage);
            }
        );
    });
})();