import browser from 'webextension-polyfill';

import getBaseInfo from './baseInfo';
import * as cache from './cache';
import getInfo from './info';
import { getErrorMessage } from './utils';

const LANGUAGE_TAG: { [langCode: string]: string } = {
  en: 'en-US',
  ko: 'ko-KR',
  ja: 'ja-JP',
};

browser.runtime.onInstalled.addListener(() => {
  const locale = LANGUAGE_TAG[browser.i18n.getUILanguage()];

  browser.runtime.onMessage.addListener(
    async (message: MediaInfoMessage, sender) => {
      const tabId = sender.tab?.id;

      if (sender.id !== browser.runtime.id) {
        return;
      }

      if (tabId == null) {
        return;
      }

      try {
        console.debug(`BG page received message ${message} from ${sender.id}`);

        const cacheKey = `${message.data.serviceName}_${message.id}`;

        try {
          return browser.tabs.sendMessage(tabId, await cache.get({ cacheKey }));
        } catch (error) {
          console.debug(
            `found error: ${cacheKey}, error: ${getErrorMessage(error)}`,
          );
        }

        const mediaInfo: MediaInfo = await getBaseInfo(message.data);
        const additionalInfos: AdditionalInfos = await getInfo(
          mediaInfo,
          locale,
        );
        const scoreMessage = {
          id: message.id,
          data: Object.assign(mediaInfo, { additional: additionalInfos }),
        };

        try {
          await cache.set({
            cacheKey,
            message: scoreMessage,
          });

          console.debug(`store done: ${cacheKey}`);
        } catch (error) {
          console.debug(
            `store fail: ${cacheKey}, error: ${getErrorMessage(error)}`,
          );
        }

        return browser.tabs.sendMessage(tabId, scoreMessage);
      } catch (error) {
        return browser.tabs.sendMessage(tabId, {
          id: message.id,
          data: {},
        });
      }
    },
  );
});
