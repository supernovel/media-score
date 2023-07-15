import axios from '../axios';
import browser from 'webextension-polyfill';
import { findItem } from './util';

const PROVIDER = 'rotten';
const DOMAIN = 'https://www.rottentomatoes.com';
const ICON = browser.runtime.getURL('/images/rottenTomatoes.png');
const REQUEST_URL = `${DOMAIN}/api/private/v2.0/search`;

export async function getInfo(baseInfo: MediaInfo): Promise<MediaInfo> {
    const { titleEn, type, year } = baseInfo;

    const response = await axios.get(REQUEST_URL, {
        responseType: 'text',
        params: {
            q: titleEn,
            t: type === 'show' ? 'tvSeries' : type,
            limit: 5
        }
    });

    const { movies, tvSeries } = response.data;
    const items = movies || tvSeries;
    const item = findItem({
        items,
        queries: [
            {
                type: 'title',
                find: titleEn,
                key: ['title', 'name']
            },
            {
                type: 'year',
                find: year,
                key: ['startYear', 'year']
            }
        ]
    });

    if (item) {
        return {
            provider: PROVIDER,
            score: item.meterScore,
            url: `${DOMAIN}${item.url}`,
            img: ICON
        };
    } else {
        throw Error(`Not Found ${titleEn}.`);
    }
}
