import browser from 'webextension-polyfill';
import axios from '../axios';
import { parseHTML } from 'linkedom';
import { compareTitle, compareYear } from './util';

const PROVIDER = 'imdb';
const ICON = browser.runtime.getURL('/images/imdb.png');
const DOMAIN = 'https://www.imdb.com';
const REQUEST_URL = 'https://sg.media-imdb.com/suggests';

export async function getInfo(baseInfo: MediaInfo): Promise<MediaInfo> {
  const baseInfoTitle = baseInfo.titleEn!.toLowerCase();

  const response = await axios.get(
    `${REQUEST_URL}/${baseInfoTitle![0]}/${baseInfoTitle.replace(
      ' ',
      '_',
    )}.json`,
    {
      responseType: 'text',
    },
  );

  // Parse jsonp format
  const data = response.data.replace(/imdb\$[^\(\)]*\((.*)\)/, '$1');
  const items: { id: string; l: string; y: number }[] = JSON.parse(data).d;
  const item = items.find(({ l: title, y: year }) => {
    return (
      compareTitle(title, baseInfoTitle) && compareYear(year, baseInfo.year)
    );
  });

  if (item != null) {
    try {
      return await getScoreInfo(item.id);
    } catch (error) {
      throw error;
    }
  } else {
    throw Error(`Not Found ${baseInfo.titleEn}.`);
  }
}

async function getScoreInfo(id: string): Promise<AdditionalInfo> {
  const itemUrl = `${DOMAIN}/title/${id}`;
  const response = await axios.get(itemUrl, { responseType: 'text' });
  const { document } = parseHTML(response.data).window;

  const dataString = document.querySelector('[type="application/ld+json"]')
    ?.textContent;
  const data = JSON.parse(dataString ?? '');

  const scoreText = data['aggregateRating']['ratingValue'];

  let score = parseFloat(scoreText || '0');

  if (isNaN(score)) {
    score = 0;
  }

  return {
    score: score * 10,
    provider: PROVIDER,
    img: ICON,
    url: itemUrl,
  };
}
