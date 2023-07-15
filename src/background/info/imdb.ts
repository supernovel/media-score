import axios from '../axios';
import browser from 'webextension-polyfill';
import { findItem } from './util';

const PROVIDER = 'imdb';
const ICON = browser.runtime.getURL('/images/imdb.png');
const DOMAIN = 'https://www.imdb.com';
const REQUEST_URL = 'https://sg.media-imdb.com/suggests';
const RESULT_SELECTOR = '.title_block .title_bar_wrapper';

export async function getInfo(baseInfo: MediaInfo): Promise<MediaInfo> {
  const { titleEn, year } = baseInfo;
  const title = titleEn!.toLowerCase();

  const response = await axios.get(
    `${REQUEST_URL}/${title![0]}/${title.replace(' ', '_')}.json`,
    {
      responseType: 'text',
    },
  );

  // Parse jsonp format
  const data = response.data.replace(/imdb\$[^\(\)]*\((.*)\)/, '$1');
  const items: unknown[] = JSON.parse(data).d;
  const item = findItem({
    items,
    queries: [
      {
        type: 'title',
        find: titleEn,
        key: 'l',
      },
      {
        type: 'year',
        find: year,
        key: 'y',
      },
    ],
  });

  if (item) {
    try {
      return await getScoreInfo(item.id);
    } catch (error) {
      throw error;
    }
  } else {
    throw Error(`Not Found ${titleEn}.`);
  }
}

async function getScoreInfo(id: string): Promise<AdditionalInfo> {
  const itemUrl = `${DOMAIN}/title/${id}`;
  const response = await axios.get(itemUrl, { responseType: 'text' });
  const body = document.createElement('div');

  body.innerHTML = response.data;

  const item = body.querySelector(RESULT_SELECTOR);

  if (item) {
    const result: AdditionalInfo = {
      provider: PROVIDER,
      img: ICON,
      url: itemUrl,
    };
    const scoreElem = item.querySelector('[itemprop="ratingValue"]');
    const countElem = item.querySelector('[itemprop="ratingCount"]');

    if (scoreElem) {
      let score = parseFloat(scoreElem.textContent || '0');

      if (isNaN(score)) {
        score = 0;
      }

      result.score = score * 10;
    }

    if (countElem) {
      let count = parseInt(countElem.textContent || '0', 10);

      if (isNaN(count)) {
        count = 0;
      }

      result.count = count * 10;
    }

    return result;
  } else {
    throw Error('Not exist item.');
  }
}
