import browser from 'webextension-polyfill';
import axios from '../axios';
import { compareTitle, compareYear } from './util';

const PROVIDER = 'rotten';
const DOMAIN = 'https://www.rottentomatoes.com';
const ICON = browser.runtime.getURL('/images/rottenTomatoes.png');
const REQUEST_URL = `${DOMAIN}/api/private/v2.0/search`;

export async function getInfo(baseInfo: MediaInfo): Promise<MediaInfo> {
  const response = await axios.get(REQUEST_URL, {
    responseType: 'text',
    params: {
      q: baseInfo.titleEn,
      t: baseInfo.type === 'show' ? 'tvSeries' : baseInfo.type,
      limit: 5,
    },
  });

  const { movies, tvSeries } = response.data;
  const items: RottenTomatoesItem[] = movies || tvSeries;
  const item = items.find((item) => {
    return (
      (compareTitle(item.title, baseInfo.titleEn) ||
        compareTitle(item.name, baseInfo.titleEn)) &&
      (compareYear(item.startYear, baseInfo.year) ||
        compareYear(item.year, baseInfo.year))
    );
  });

  if (item) {
    return {
      provider: PROVIDER,
      score: item.meterScore,
      url: `${DOMAIN}${item.url}`,
      img: ICON,
    };
  } else {
    throw Error(`Not Found ${baseInfo.titleEn}.`);
  }
}

interface RottenTomatoesItem {
  title: string;
  name: string;
  startYear: string;
  year: string;
  meterScore: number;
  url: string;
}
