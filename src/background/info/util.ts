const TITLE_REGEXP = /[^a-z가-힣]/g;
const LOCALE_REG = /^([a-z]{2})-([A-Z]{2})$/;

export function compareTitle(target?: string, source?: string) {
  return normalizeTitle(target).match(new RegExp(normalizeTitle(source)));
}

export function compareYear(
  target?: string | number,
  source?: string | number,
) {
  const targetYear = normalizeYear(target);
  const sourceYear = normalizeYear(source);

  return (
    targetYear == sourceYear ||
    targetYear == sourceYear - 1 ||
    targetYear - 1 == sourceYear
  );
}

export function compareType(target?: string, source?: string) {
  return normalizeType(target) == normalizeType(source);
}

function normalizeTitle(value?: string): string {
  return (value || '').toLowerCase().replace(TITLE_REGEXP, '');
}

function normalizeType(value?: string): string {
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
      return value ?? '';
  }
}

function normalizeYear(value?: string | number): number {
  if (value == null) {
    return 0;
  } else if (typeof value !== 'number') {
    return parseInt(value.split('-')[0], 10);
  } else {
    return value as number;
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
