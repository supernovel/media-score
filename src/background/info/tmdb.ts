import axios from 'axios';
import { findItem } from './util';

const PROVIDER = 'tmdb';
const ICON = 'https://www.themoviedb.org/favicon.ico';
const DOMAIN = 'https://www.themoviedb.org';
const REQUEST_URL = `${DOMAIN}/search/multi`;

export async function getInfo(
    baseInfo: MediaInfo,
    locale?: string
): Promise<MediaInfo> {
    const { title, titleEn, type, year } = baseInfo;

    const response = await axios.get(REQUEST_URL, {
        params: {
            query: title,
            language: locale || 'en-US'
        }
    });
    const items = response.data.results;
    const item = findItem({
        items: items.filter(value => {
            return value && value instanceof Object;
        }),
        // type=movie => { title, release_date, media_type } type=show => { name, first_air_date, media_type }
        queries: [
            {
                type: 'title_en',
                find: titleEn,
                key: ['title', 'name']
            },
            {
                type: 'year',
                find: year,
                key: ['release_date', 'first_air_date']
            },
            {
                type: 'type',
                find: type,
                key: 'media_type'
            }
        ]
    });

    if (item) {
        const { vote_average, media_type, id } = item;

        return {
            provider: PROVIDER,
            score: (vote_average || 0) * 10,
            url: `${DOMAIN}/${media_type}/${id}?language=${locale}`,
            img: ICON
        };
    } else {
        throw Error(`Not Found ${titleEn}.`);
    }
}
