import browser from 'webextension-polyfill';
import axios from '../axios';
import { compareTitle, compareType, compareYear } from './util';

const PROVIDER = 'tmdb';
const ICON = browser.runtime.getURL('/images/tmdb.png');
const DOMAIN = 'https://www.themoviedb.org';
const REQUEST_URL = `${DOMAIN}/search/multi`;

export async function getInfo(
  baseInfo: MediaInfo,
  locale?: string,
): Promise<MediaInfo> {
  const response = await axios.get(REQUEST_URL, {
    params: {
      query: baseInfo.title,
      language: locale || 'en-US',
    },
  });
  const items: TmdbItem[] = response.data.results;
  const item = items.find((item) => {
    return (
      ((compareTitle(item.original_name, baseInfo.title) ||
        compareTitle(item.name, baseInfo.title) ||
        compareTitle(item.original_name, baseInfo.titleEn)) &&
        (compareYear(item.release_date, baseInfo.year) ||
          compareYear(item.first_air_date, baseInfo.year))) ||
      compareType(item.media_type, baseInfo.type)
    );
  });

  if (item) {
    const { vote_average: voteAverage, media_type: mediaType, id } = item;

    return {
      provider: PROVIDER,
      score: (voteAverage || 0) * 10,
      url: `${DOMAIN}/${mediaType}/${id}?language=${locale}`,
      img: ICON,
    };
  } else {
    throw Error(`Not Found ${baseInfo.titleEn}.`);
  }
}

interface TmdbItem {
  id: string;
  original_name: string;
  name: string;
  release_date: string;
  first_air_date: string;
  media_type: string;
  vote_average?: number;
}
