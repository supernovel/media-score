import axios from 'axios';
import ScoreGetter from './ScoreGetter';

const PROVIDER = 'imdb';
const PROVIDER_IMG = 'https://ia.media-imdb.com/images/G/01/imdb/images/favicon-2165806970';
const DOMAIN = 'https://www.imdb.com';
const REQUEST_URL = 'https://sg.media-imdb.com/suggests';
const RESULT_SELECTOR ='.title_block .title_bar_wrapper';

export class ImdbGetter extends ScoreGetter {
    protected supportedLocale = ['en-US', 'ko-KR'];

    constructor(locale = 'en-US') {
        super(locale, PROVIDER);
    }

    /**
     * @url https://sg.media-imdb.com/suggests/:title[0]/:title.json
     */
    protected async getData({ titleEn, year }: MediaInfo) {
        let lTitle = titleEn!.toLowerCase();

        const response = await axios.get(
            `${REQUEST_URL}/${lTitle![0]}/${lTitle.replace(' ', '_')}.json`,
            {
                responseType: 'text'
            }
        );
        // Parse jsonp format
        const items = (JSON.parse(response.data.replace(/imdb\$.*\((.*)\)/, '$1'))).d;
        let item = this.findItem({
            items,
            matchQueries: [{
                type: 'title_en',
                find: titleEn,
                key: 'l'
            },
            {
                type: 'year',
                find: year,
                key: 'y'
            }]
        });

        if(item){
            // Get Score
            item = await this.getItem(item.id);
        }
        
        if(item){
            return {
                score: item.score,
                url: item.url,
                img: PROVIDER_IMG
            };
        }else{
            throw Error(`Not found ${titleEn}`);
        }
    }

    private async getItem(id: string): Promise<ScoreInfo|undefined> {
        const itemUrl = `${DOMAIN}/title/${id}`;
        const response = await axios.get(
            itemUrl, 
            { responseType : 'text'}
        );
        const body = document.createElement('div');

        body.innerHTML = response.data;

        const item = body.querySelector(RESULT_SELECTOR);

        if (item) {
            const result: ScoreInfo = {
                url: itemUrl
            };
            const scoreElem = item.querySelector('[itemprop="ratingValue"]');
            const countElem = item.querySelector('[itemprop="ratingCount"]');

            if (scoreElem) {
                let score = parseFloat(
                    scoreElem.textContent || '0'
                );

                if (isNaN(score)) {
                    score = 0;
                }

                result.score = score * 10;
            }

            return result;
        }
    }
}

export default new ImdbGetter();