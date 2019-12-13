import { browser } from 'webextension-polyfill-ts';

const VALID_PERIOD = 7; // 7day

/**
 * if `period > 0` then `return Date.now() + period(days)`;
 * else `return Date.now()`;
 *
 * @param {number} period unsigned number
 */
function getTimestamp(period?: number) {
    if (period && period > 0) {
        const currentDate = new Date();
        return currentDate.setDate(currentDate.getDate() + period);
    } else {
        return Date.now();
    }
}

export async function get({
    cacheKey,
    period
}: {
    cacheKey: string;
    period?: number;
}) {
    const cacheObject = await browser.storage.local.get(cacheKey);
    let cacheValue: any = cacheObject[cacheKey];

    if (cacheValue) {
        console.debug(`found: ${cacheKey}`, cacheValue);
        cacheValue = JSON.parse(cacheValue);
        const { timestamp, value } = cacheValue;

        if (timestamp > getTimestamp(period || VALID_PERIOD)) {
            throw Error('Expired cache');
        } else if (value) {
            return value;
        }
    }

    throw Error('Not found');
}

export async function set({
    cacheKey,
    message
}: {
    cacheKey: string;
    message: any;
}) {
    await browser.storage.local.set({
        [cacheKey]: JSON.stringify({
            timestamp: getTimestamp(),
            value: message
        })
    });
}
