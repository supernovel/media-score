/**
 * Abstract Getter 
 */
import { get } from 'lodash-es';

const TITLE_REGEXP = /[^a-z가-힣]/g;

export default abstract class ScoreGetter {
    protected supportLocales = ['en-US', 'ko-KR'];
    protected language: string = 'en';
    protected region: string = 'US';

    constructor(
        protected locale: string = 'en-US',
        protected provider: string = 'unknown'
    ) {
        this.applyLocale(locale);
    }

    /**
     * Get score info (wrapper)
     * 
     * @param data media info
     */
    public async get(data: MediaInfo): Promise<ScoreInfos> {
        if (data.title == null) {
            throw Error('Require title.');
        } else {
            return {
                [this.provider] : await this.getData(data)
            };
        }
    }

    /**
     * Change default locale
     * 
     * @param locale 
     */
    public applyLocale(locale: string): void{
        if(this.supportLocales.includes(locale)){
            const [ language, region ] = locale.split('-');
            this.locale = locale;
            this.language = language;
            this.region = region;
        }else{
            this.locale = this.supportLocales[0];
        }
    }

    /**
     * Remove non-alphabet characters
     * 
     * @param string 
     */
    protected nomalizeString(string: string): string {
        return (string || '').toLowerCase().replace(TITLE_REGEXP, '');
    }


    /**
     * Find function
     * 
     * @param options
     * @param options.items
     * @param options.findTitle
     * @param options.findYear
     * @param options.titleKey
     * @param options.yearKey
     */
    protected findItem({ 
        items, 
        matchQueries
    }: FindItemOpts){
        if(items && items instanceof Array && items.length){
            let matchedItems = items;

            for(let matchQuery of matchQueries){
                const keys = wrapArray(matchQuery.key);
                const findType = matchQuery.type;
                const findValue = nomalizeValue(findType, matchQuery.find);

                matchedItems = matchedItems.filter((item) => {
                    let itemValue;
    
                    for(let key of keys){
                        if(itemValue = get(item, key)) break;
                    }

                    itemValue = nomalizeValue(findType, itemValue);
    
                    return (itemValue === findValue);
                });

                if(matchedItems.length < 2) break;
            }

            return matchedItems[0];
        }
    }

    /**
     * Get score info
     * 
     * @param data 
     */
    protected abstract async getData(data: MediaInfo): Promise<ScoreInfo>;
}

/**
 * title => Remove non-alphabet characters
 * type => [movie, show]
 * year => [0-9]{4}
 * 
 * @param type 
 * @param value 
 */
function nomalizeValue(type: string, value: any): any {
    switch(type){
        case 'title':
            return (value || '').toLowerCase().replace(TITLE_REGEXP, '');
        case 'type':
            switch(value){
                case 'tv': case 'show': case'series': case 'tv_seasons':
                    return 'show';
                case 'movies': case 'movie':
                    return 'movie';
                default:
                    return value;
            }
        case 'year':
            if(typeof value === 'string'){
                return parseInt(value.split('-')[0]);
            }else return value;
    }
}

function wrapArray(data: any): Array<any>{
    if(data == null){
        return [];
    }else if(!(data instanceof Array)){
        return [data];
    }else return data;
}

export interface FindItemOpts{
    items: Array<any>
    matchQueries: Array<{
        type: string,
        find: any,
        key: string|Array<string>
    }>
}