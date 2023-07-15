import * as netflix from './netflix';

export default async function getBaseInfo(data: MediaInfo): Promise<MediaInfo> {
  let baseInfo;

  switch (data.serviceName) {
    case 'netflix':
      baseInfo = await netflix.getBaseInfo(data);
      break;
  }

  return Object.assign({}, data, baseInfo);
}
