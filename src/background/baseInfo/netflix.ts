import qs from 'querystring';
import axios from 'axios';

const NEFLIX_API_URL = 'https://www.netflix.com/api/shakti';

/**
 * 
 * @url https://www.netflix.com/api/shakti/:apiBuildVersion/pathEvaluator?languages=en
 * @header Content-Type:application/x-www-form-urlencoded
 * @data {path: [ 
 *          '["videos", :id ,["availability","bookmarkPosition","creditsOffset"]]',
 *          '["videos", :id ,"preplay",254015180,"experience"]' 
 *       ]}
 */
export async function getBaseInfo({ id, apiBuildVersion }: MediaInfo){
    const response = await axios.post(
        `${NEFLIX_API_URL}/${apiBuildVersion}/pathEvaluator?languages=en`,
        qs.stringify({
            'path': [`["videos",${id},["summary","title","releaseYear"]]`]
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    );
    const data: NetflixSubInfoResponse = response.data.value;

    try{
        return {
            titleEn: data.videos[id!].title,
            year: data.videos[id!].releaseYear,
            type: data.videos[id!].summary.type
        };
    }catch(e){}
}

interface NetflixSubInfoResponse{
    videos: {
        [videoId:string]: {
            title: string,
            releaseYear: number,
            summary: {
                id: number,
                type: string,
                isNSRE: boolean,
                isOriginal: boolean,
            }
        }
    },
    genres: {
        [genresId: string]: {
            name: string
        }
    }
}