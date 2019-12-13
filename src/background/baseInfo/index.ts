import * as netflix from './netflix';
import * as watcha from './watcha';

export default async function getBaseInfo(data: MediaInfo): Promise<MediaInfo> {
    let baseInfo;

    switch (data.serviceName) {
        case 'netflix':
            baseInfo = await netflix.getBaseInfo(data);
            break;
        case 'watcha':
            baseInfo = await watcha.getBaseInfo(data);
            break;
    }

    return Object.assign({}, data, baseInfo);
}
