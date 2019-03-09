import axios from 'axios';

const WATCHA_CONTENT_URL = 'https://play.watcha.net/contents';
const TYPE: { [key: string]: string } = {
    tv_season: 'show'
};

export async function get({ id }: MediaInfo){
    const response = await axios.get(
        `${WATCHA_CONTENT_URL}/${id}/jumbotron.json`
    );
    const { 
        year, 
        content_type, 
        title,
        eng_title 
    }: WatchaSubInfoResponse = response.data;

    console.log(response.data);
    
    return {
        year,
        type: (TYPE[content_type] || content_type),
        title,
        titleEn: eng_title
    };
}

interface WatchaSubInfoResponse{
    year: number,
    content_type: string,
    title: string,
    eng_title: string
}