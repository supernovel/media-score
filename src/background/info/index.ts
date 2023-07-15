import * as tmdb from './tmdb';
import * as watcha from './watcha';
import * as imdb from './imdb';
import * as rottenTomatoes from './rottenTomatoes';

export default async function getInfos(
  data: MediaInfo,
  locale?: string,
): Promise<AdditionalInfos> {
  const infos: Array<AdditionalInfo | null> = await Promise.all(
    [
      tmdb.getInfo(data, locale),
      watcha.getInfo(data, locale),
      imdb.getInfo(data),
      rottenTomatoes.getInfo(data),
    ].map((promise) =>
      promise.catch((error) => {
        console.error(error);
        return null;
      }),
    ),
  );

  return infos.reduce((merged, value) => {
    if (value != null && value.provider != null) {
      Object.assign(merged, { [value.provider]: value });
    }
    return merged;
  }, {} as AdditionalInfos);
}
