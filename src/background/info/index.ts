import { get as getNetflixInfo } from './Netflix';
import { get as getWatcharInfo } from './Watcha';

export default async function get(data: MediaInfo): Promise<MediaInfo>{
    let additionalInfo;
    
    switch(data.serviceName){
        case 'netflix':
            additionalInfo = await getNetflixInfo(data);
            break;
        case 'watcha':
            additionalInfo = await getWatcharInfo(data);
            break;
    }

    return Object.assign({}, data, additionalInfo);
}