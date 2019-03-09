import axios from 'axios';
import ScoreGetter from './ScoreGetter';

const PROVIDER = 'tmdb';
const PROVIDER_IMG = 'https://www.themoviedb.org/favicon.ico';
const DOMAIN = 'https://www.themoviedb.org';
const REQUEST_URL = `${DOMAIN}/search/multi`;

export class TmdbGetter extends ScoreGetter {
    protected supportedLocale = ['en-US', 'ko-KR'];

    constructor(locale = 'en-US') {
        super(locale, PROVIDER);
    }

    /**
     * @url https://www.themoviedb.org/search/multi?query=:title&language=en-US
     */
    protected async getData({ title, titleEn, year, type }: MediaInfo) {
        const response = await axios.get(REQUEST_URL, {
                params: {
                    query: title,
                    language: 'en-US'
                }
            });
        const items = response.data.results;
        let item = this.findItem({
            items: items.filter((item) => { return (item && item instanceof Object);}),
            // type=movie => { title, release_date, media_type } type=show => { name, first_air_date, media_type }
            matchQueries: [{
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
            }]
        });

        if(item){
            const { vote_average, media_type, id } = item;

            return {
                score: (vote_average || 0) * 10,
                url: `${DOMAIN}/${media_type}/${id}?language=${this.locale}`,
                img: PROVIDER_IMG
            };
        }else {
            throw Error(`Not found ${titleEn}`);
        }
    }
}

export default new TmdbGetter();