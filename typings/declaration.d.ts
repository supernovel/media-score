// declaration.d.ts
declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare interface AdditionalInfos {
  [providerName: string]: AdditionalInfo;
}

declare interface MediaInfoMessage {
  id: string;
  data: MediaInfo;
}

declare interface MediaInfo {
  id?: string | number;
  title?: string;
  titleEn?: string;
  year?: string | number;
  type?: string;
  apiBuildVersion?: string; //netflix only
  serviceName?: string;
  additional?: AdditionalInfos;
  [propName: string]: any;
}

declare interface AdditionalInfo {
  provider?: string;
  score?: number;
  url?: string;
  img?: string;
  [propName: string]: any;
}
