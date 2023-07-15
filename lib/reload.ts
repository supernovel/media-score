import browser from 'webextension-polyfill';
import io from 'socket.io-client';
import { watchPort } from '../package.json';

const REALOAD = '__isReload__';

(async () => {
    // Check that page reload is required.
    const item = await browser.storage.sync.get(REALOAD);

    if (item[REALOAD]) {
        // Reload active tabs. * I don't no how get extension script page *
        const tabInfos = await browser.tabs.query({
            active: true
        });

        tabInfos.map(tabInfo => {
            return browser.tabs.reload(tabInfo.id);
        });
    }

    // Remove reload flag
    await browser.storage.sync.remove(REALOAD);

    const socket = io(`http://localhost:${watchPort}`, {
        reconnectionAttempts: 5,
    });
    socket.on('reload', async () => {
        // Set reload flag
        await browser.storage.sync.set({
            [REALOAD]: true
        });

        // Reload extension
        browser.runtime.reload();
    });
})();
