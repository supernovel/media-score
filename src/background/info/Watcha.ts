import axios from 'axios';
import { findItem, parseLocale } from './util';

const PROVIDER = 'watcha';
const ICON = 'https://watcha.com/favicon.ico';
const DOMAIN = 'https://watcha.com';
const API_DOMAIN = 'https://api.watcha.com';
const REQUEST_URL = `${API_DOMAIN}/api/searches`;
const REQUEST_HEADER = {
    'x-watcha-client-version': '1.0.0',
    'x-watcha-client': 'Watcha-WebApp'
};

/**
 * @url https://api.watcha.com/api/searches?query=:title
 * @header x-watcha-client-version:1.0.0
 * @header x-watcha-client Watcha-WebApp
 * @header x-watcha-client-language: en|ko
 * @header x-watcha-client-region US|KR
 */
export async function getInfo(
    baseInfo: MediaInfo,
    locale?: string
): Promise<MediaInfo> {
    const { title, titleEn, type, year } = baseInfo;
    const { language, country } = parseLocale(locale || '');

    const response = await axios.get(REQUEST_URL, {
        params: {
            query: title
        },
        headers: Object.assign(
            {
                'x-watcha-client-language': language,
                'x-watcha-client-region': country
            },
            REQUEST_HEADER
        )
    });

    const items = (response.data.result || {})[
        type === 'movie' ? 'movies' : 'tv_seasons'
    ];
    const item = findItem({
        items,
        queries: [
            {
                type: 'title',
                find: title,
                key: 'title'
            },
            {
                type: 'year',
                find: year,
                key: 'year'
            },
            {
                type: 'type',
                find: type,
                key: 'content_type'
            }
        ]
    });

    if (item) {
        const { ratings_avg, code } = item as WatchaItem;

        return {
            provider: PROVIDER,
            score: (ratings_avg || 0) * 10,
            url: `${DOMAIN}/${locale}/contents/${code}`,
            img: ICON
        };
    } else {
        throw Error(`Not found ${titleEn}`);
    }
}

interface WatchaItem {
    code: string;
    content_type: string;
    ratings_avg: number;
    title: string;
    year: number;
}
