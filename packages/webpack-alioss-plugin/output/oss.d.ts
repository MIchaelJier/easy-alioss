import { AliOSSConfig } from './types';
declare class AliOSS {
    config: AliOSSConfig;
    paramOptions?: object;
    uploadSum: number;
    client: any;
    assets: object;
    constructor(options?: object);
    static getFormat(format?: string): string;
    getFormat(format?: string): string;
    init(options?: object): Promise<void>;
    upload(): Promise<void>;
    delFilterAssets(prefix: string): Promise<void>;
    delCacheAssets(): Promise<void>;
    asyncForEach(arr: Array<any>, cb: Function): Promise<void>;
    delAllAssets(): Promise<void>;
    uploadAssets(): Promise<void>;
    filterFile(name: string): boolean;
    getFileName(name: string): string;
    update(name: string, content: any): Promise<void>;
    uploadLocale(dir: string): Promise<void>;
}
export default AliOSS;
