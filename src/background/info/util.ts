import get from 'lodash-es/get';

const TITLE_REGEXP = /[^a-z가-힣]/g;
const LOCALE_REG = /^([a-z]{2})-([A-Z]{2})$/;

/**
 * title => Remove non-alphabet characters
 * type => [movie, show]
 * year => [0-9]{4}
 *
 * @param type
 * @param value
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeValue(type: string, value: string): any {
  switch (type) {
    case 'title':
      return (value || '').toLowerCase().replace(TITLE_REGEXP, '');
    case 'type':
      switch (value) {
        case 'tv':
        case 'show':
        case 'series':
        case 'tv_seasons':
          return 'show';
        case 'movies':
        case 'movie':
          return 'movie';
        default:
          return value;
      }
    case 'year':
      if (typeof value === 'string') {
        return parseInt(value.split('-')[0], 10);
      } else {
        return value;
      }
  }
}

export function findItem({
  items,
  queries,
}: {
  items: object[];
  queries: Array<{
    type: string;
    find: object;
    key: string | string[];
  }>;
}) {
  if (items && items instanceof Array && items.length) {
    let matchedItems = items;

    for (const query of queries) {
      const keys = wrapArray(query.key);
      const findType = query.type;
      const findValue = normalizeValue(findType, query.find);

      matchedItems = matchedItems.filter((item) => {
        let itemValue;

        for (const key of keys) {
          itemValue = get(item, key);

          if (itemValue != null) {
            break;
          }
        }

        if (itemValue != null) {
          itemValue = normalizeValue(findType, itemValue);

          let isEqual: boolean = itemValue === findValue;

          if (!isEqual && typeof itemValue === 'string') {
            const length = Math.min(itemValue.length, findValue.length);

            isEqual =
              itemValue.substr(0, length) === findValue.substr(0, length);
          }

          return isEqual;
        }
      });

      if (matchedItems.length < 2) {
        break;
      }
    }

    return matchedItems[0];
  }
}

export function wrapArray(data: string | string[]): string[] {
  if (data == null) {
    return [];
  } else if (!(data instanceof Array)) {
    return [data];
  } else {
    return data;
  }
}

export function parseLocale(locale: string): {
  language: string;
  country: string;
} {
  const match = (locale || '').match(LOCALE_REG) || [];
  return {
    language: match[1] || '',
    country: match[2] || '',
  };
}
