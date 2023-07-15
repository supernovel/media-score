import browser from 'webextension-polyfill';
import axios from '../axios';
import { compareTitle, compareYear, parseLocale } from './util';

const PROVIDER = 'watcha';
const ICON = browser.runtime.getURL('/images/watcha.png');
const DOMAIN = 'https://pedia.watcha.com';
const API_DOMAIN = 'https://pedia.watcha.com';
const REQUEST_URL = `${API_DOMAIN}/api/searches`;
const REQUEST_DETAIL_URL = `${API_DOMAIN}/api/contents/`;
const REQUEST_HEADER = {
  accept: 'application/vnd.frograms+json;version=20',
  'x-watcha-client-version': '2.0.0',
  'x-watcha-client': 'Watcha-WebApp',
};

/**
 * @url https://api-pedia.watcha.com/api/searches?query=:title
 * @header x-watcha-client-version:1.0.0
 * @header x-watcha-client Watcha-WebApp
 * @header x-watcha-client-language: en|ko
 * @header x-watcha-client-region US|KR
 */
export async function getInfo(
  baseInfo: MediaInfo,
  locale?: string,
): Promise<MediaInfo> {
  const { language, country } = parseLocale(locale || '');

  const response = await axios.get<WatchaResponse>(REQUEST_URL, {
    params: {
      query: baseInfo.title,
    },
    headers: Object.assign(
      {
        'x-watcha-client-language': language,
        'x-watcha-client-region': country,
      },
      REQUEST_HEADER,
    ),
  });

  const items = (response.data.result || {})[
    baseInfo.type === 'movie' ? 'movies' : 'tv_seasons'
  ];
  const item = items.find(({ title, year }) => {
    return (
      compareTitle(title, baseInfo.title) && compareYear(year, baseInfo.year)
    );
  });

  if (item) {
    const { ratings_avg: ratingsAvg } = await getContentDetail(
      item,
      language,
      country,
    );

    return {
      provider: PROVIDER,
      score: (ratingsAvg || 0) * 10,
      url: `${DOMAIN}/${locale}/contents/${item.code}`,
      img: ICON,
    };
  } else {
    throw Error(`Not found ${baseInfo.titleEn}`);
  }
}

async function getContentDetail(
  item: WatchaItem,
  language: string,
  country: string,
): Promise<WatchaDetailResponse['result']> {
  const response = await axios.get<WatchaDetailResponse>(
    `${REQUEST_DETAIL_URL}/${item.code}`,
    {
      headers: Object.assign(
        {
          'x-watcha-client-language': language,
          'x-watcha-client-region': country,
        },
        REQUEST_HEADER,
      ),
    },
  );

  return response.data.result;
}

interface WatchaResponse {
  result: {
    search_id: string;
    movies: WatchaItem[];
    tv_seasons: WatchaItem[];
  };
}

interface WatchaDetailResponse {
  result: {
    ratings_avg: number;
    ratings_count: number;
  };
}

interface WatchaItem {
  code: string;
  content_type: string;
  ratings_avg: number;
  title: string;
  year: number;
}
