import browser from 'webextension-polyfill';

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
  period,
}: {
  cacheKey: string;
  period?: number;
}) {
  const cacheObject = await browser.storage.local.get(cacheKey);
  const cacheValueString: string | null = cacheObject[cacheKey];

  if (cacheValueString != null) {
    console.debug(`found: ${cacheKey}`, cacheValueString);
    const cacheValue = JSON.parse(cacheValueString);
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
  message,
}: {
  cacheKey: string;
  message: object;
}) {
  await browser.storage.local.set({
    [cacheKey]: JSON.stringify({
      timestamp: getTimestamp(),
      value: message,
    }),
  });
}
