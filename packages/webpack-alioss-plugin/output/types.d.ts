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
