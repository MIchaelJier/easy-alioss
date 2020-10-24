import AliOSS from './oss';
export declare class WebpackAliOSSPlugin extends AliOSS {
    constructor(options?: object);
    init(compiler: any): Promise<void>;
    apply(compiler: any): Promise<void>;
}
