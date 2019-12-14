import { browser } from 'webextension-polyfill-ts';

import * as cache from './cache';
import getBaseInfo from './baseInfo';
import getInfo from './info';

const LANGUAGE_TAG: { [langCode: string]: string } = {
    en: 'en-US',
    ko: 'ko-KR',
    ja: 'ja-JP'
};

(() => {
    const locale = LANGUAGE_TAG[browser.i18n.getUILanguage()];

    browser.runtime.onConnect.addListener(async port => {
        if (port.name !== 'media_score') {
            return;
        }

        port.onMessage.addListener(async (message: MediaInfoMessage, port) => {
            console.debug(`BG page received message ${message} from ${port}`);

            const cacheKey = `${message.data.serviceName}_${message.id}`;

            try {
                return port.postMessage(await cache.get({ cacheKey }));
            } catch (error) {
                console.debug(
                    `found error: ${cacheKey}, error: ${error.message}`
                );
            }

            const mediaInfo: MediaInfo = await getBaseInfo(message.data);
            const additionalInfos: AdditionalInfos = await getInfo(
                mediaInfo,
                locale
            );
            const scoreMessage = {
                id: message.id,
                data: Object.assign(mediaInfo, { additional: additionalInfos })
            };

            try {
                await cache.set({
                    cacheKey,
                    message: scoreMessage
                });

                console.debug(`store done: ${cacheKey}`);
            } catch (error) {
                console.debug(
                    `store fail: ${cacheKey}, error: ${error.message}`
                );
            }

            return port.postMessage(scoreMessage);
        });
    });
})();
