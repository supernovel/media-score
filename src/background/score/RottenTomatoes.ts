import axios from 'axios';
import ScoreGetter from './ScoreGetter';

const PROVIDER = 'rottentomatoes';
const DOMAIN = 'https://www.rottentomatoes.com';
const PROVIDER_IMG = `${DOMAIN}/assets/pizza-pie/images/icons/global/new-fresh-lg.12e316e31d2.png`;
const REQUEST_URL = `${DOMAIN}/api/private/v2.0/search`;

export class TomatoesGetter extends ScoreGetter {
    protected supportedLocale = ['en-US', 'ko-KR'];

    constructor(locale = 'en-US') {
        super(locale, PROVIDER);
    }

    /**
     * @url https://www.rottentomatoes.com/api/private/v2.0/search?q=:title&t=:type&limit=5
     */
    protected async getData({ titleEn, type, year }: MediaInfo) {
        const response = await axios.get(REQUEST_URL, {
                responseType: 'text',
                params: {
                    q: titleEn,
                    t: (type == 'show') ? 'tvSeries' : type,
                    limit: 5
                }
            });

        const { movies, tvSeries } = response.data;
        const items = movies || tvSeries;
        let item = this.findItem({
            items,
            matchQueries: [{
                type: 'title_en',
                find: titleEn,
                key: ['title', 'name']
            },
            {
                type: 'year',
                find: year,
                key: ['startYear', 'year']
            }]
        });

        if(item){
            return {
                score: item.meterScore,
                url: `${DOMAIN}${item.url}`,
                img: PROVIDER_IMG
            };
        }else{
            throw Error(`Not found ${titleEn}`);
        }
    }
}

export default new TomatoesGetter();
