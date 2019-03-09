import Tmdb from './Tmdb';
import Watcha from './Watcha';
import Imdb from './Imdb';
import RottenTomatoes from './RottenTomatoes';

export default async function get(data: MediaInfo): Promise<ScoreInfos>{
    const scoreInfos:Array<ScoreInfos | null> = await Promise.all([
        Tmdb.get(data).catch(() => null),
        Watcha.get(data).catch(() => null),
        Imdb.get(data).catch(() => null),
        RottenTomatoes.get(data).catch(() => null)
    ]);

    return <ScoreInfos>scoreInfos.reduce((mergedData, data) => {
        Object.assign(mergedData, data);
        return mergedData;
    }, {});
}

export function applyLocale(locale: string){
    Tmdb.applyLocale(locale);
    Watcha.applyLocale(locale);
    Imdb.applyLocale(locale);
    RottenTomatoes.applyLocale(locale);
}