import OSS from 'ali-oss';
export declare type DeepPartial<T> = {
    [U in keyof T]?: T[U] extends object ? DeepPartial<T[U]> : T[U];
};
export interface AliOSSConfig {
    accessKeyId: string;
    accessKeySecret: string;
    region: string;
    bucket: string;
    prefix: string;
    exclude: Array<RegExp>;
    deleteAll: boolean;
    local: boolean;
    output: string;
    limit: number;
    format: string;
}
export declare type ParamOptions = Partial<AliOSSConfig>;
export declare type Alioss = {
    [propName in keyof OSS]?: OSS[propName] | any;
};
export interface Assets {
    [propName: string]: any;
}
export interface Compiler {
    [propName: string]: any;
}
