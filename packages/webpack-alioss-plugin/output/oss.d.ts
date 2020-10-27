import { AliOSSConfig, ParamOptions, Assets, Alioss } from './types';
declare class AliOSS {
    config: AliOSSConfig;
    paramOptions?: ParamOptions;
    uploadSum: number;
    client: Alioss;
    assets: Assets;
    constructor(options?: ParamOptions);
    static getFormat(format?: string): string;
    getFormat(format?: string): string;
    init(options?: ParamOptions): Promise<void>;
    upload(): Promise<void>;
    delFilterAssets(prefix: string | undefined): Promise<void>;
    delCacheAssets(): Promise<void>;
    asyncForEach(arr: Array<unknown>, cb: Function): Promise<void>;
    delAllAssets(): Promise<void>;
    uploadAssets(): Promise<void>;
    filterFile(name: string): boolean;
    getFileName(name: string): string;
    update(name: string, content: string | Buffer): Promise<void>;
    uploadLocale(dir: string): Promise<void>;
    uploadLocaleBase(dir: string, callback?: Function): Promise<void>;
}
export default AliOSS;
