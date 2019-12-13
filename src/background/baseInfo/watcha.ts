import axios from 'axios';

const WATCHA_API_URL = 'https://play.watcha.net/api/contents';
const TYPE: { [key: string]: string } = {
    tv_season: 'show'
};
const REQUEST_HEADER = {
    'x-watchaplay-client-version': '1.0.0',
    'x-watchaplay-client': 'WatchaPlay-WebApp',
    'accept': 'application/vnd.frograms+json;version=4'
};

export async function getBaseInfo({ id }: MediaInfo) {
    const response = await axios.get(`${WATCHA_API_URL}/${id}.json`, {
        params: {
            comments_limit: 16
        },
        headers: REQUEST_HEADER
    });
    const {
        year,
        content_type,
        title,
        eng_title
    }: WatchaSubInfoResponse = response.data;

    console.log(response.data);

    return {
        year,
        type: TYPE[content_type] || content_type,
        title,
        titleEn: eng_title
    };
}

interface WatchaSubInfoResponse {
    year: number;
    content_type: string;
    title: string;
    eng_title: string;
}
