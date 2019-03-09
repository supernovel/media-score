// declaration.d.ts
declare module '*.scss' {
    const content: { [className: string]: string };
    export default content;
}

declare interface ScoreInfos {
    [providerName: string]: ScoreInfo
}

declare interface ScoreInfo {
    score?: number
    url?: string
    img?: string;
}

declare interface MediaInfo {
    id?: string|number
    title?: string
    titleEn?: string
    year?: string|number
    type?: string
    apiBuildVersion?: string //netflix only
    serviceName?: string
    [propName: string]: any
}