import AliOSS from './oss';
import { Compiler, Assets } from './types';
declare class WebpackAliOSSPlugin extends AliOSS {
    init(compiler: Compiler): Promise<void>;
    apply(compiler: Compiler): Promise<void>;
    uploads(compilation: Assets, callback?: Function): Promise<void | Function>;
}
export default WebpackAliOSSPlugin;
