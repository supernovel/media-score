import axios from 'axios';
import ScoreGetter from './ScoreGetter';

const PROVIDER = 'watcha';
const PROVIDER_IMG = 'https://watcha.com/favicon.ico';
const DOMAIN = 'https://watcha.com';
const API_DOMAIN = 'https://api.watcha.com';
const REQUEST_URL = `${API_DOMAIN}/api/searches`;
const REQUEST_HEADER = {
    'x-watcha-client-version': '1.0.0',
    'x-watcha-client': 'Watcha-WebApp'
};

export class WatchaGetter extends ScoreGetter {
    protected supportedLocale = ['en-US', 'ko-KR'];

    constructor(locale = 'en-US') {
        super(locale, PROVIDER);
    }

    /**
     * @url https://api.watcha.com/api/searches?query=:title
     * @header x-watcha-client-version:1.0.0
     * @header x-watcha-client Watcha-WebApp
     * @header x-watcha-client-language: en|ko
     * @header x-watcha-client-region US|KR
     */
    protected async getData({ title, titleEn, year, type }: MediaInfo) {
        const response = await axios.get(REQUEST_URL, {
                params: {
                    query: title
                },
                headers: Object.assign({
                    'x-watcha-client-language': this.language,
                    'x-watcha-client-region': this.region
                }, REQUEST_HEADER)
            });
        const items = (response.data.result || {})[type === 'movie' ? 'movies' : 'tv_seasons'];
        let item = this.findItem({
            items,
            matchQueries: [{
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
            }]
        });

        if(item){
            const { ratings_avg, code } = <WatchaItem>item;

            return {
                score: (ratings_avg || 0) * 10,
                img: PROVIDER_IMG,
                url: `${DOMAIN}/${this.locale}/contents/${code}`
            };
        }else{
            throw Error(`Not found ${titleEn}`);
        }
    }
}

export default new WatchaGetter();

interface WatchaItem{
    code: string;
    content_type: string;
    ratings_avg: number;
    title: string;
    year: number;
}