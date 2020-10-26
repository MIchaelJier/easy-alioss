"use strict";
const tslib_1 = require("tslib");
const ansi_colors_1 = tslib_1.__importDefault(require("ansi-colors"));
const fancy_log_1 = tslib_1.__importDefault(require("fancy-log"));
const oss_1 = tslib_1.__importDefault(require("./oss"));
const progress_1 = tslib_1.__importDefault(require("progress"));
class WebpackAliOSSPlugin extends oss_1.default {
    // constructor(options?: object) {
    //   super(options)
    // }
    init(compiler) {
        const _super = Object.create(null, {
            init: { get: () => super.init },
            getFormat: { get: () => super.getFormat }
        });
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield _super.init.call(this, this.paramOptions);
            if (!this.config.output && this.config.local) {
                const output = compiler.outputPath || compiler.options.output.path;
                if (output) {
                    this.config.output = output;
                }
                else {
                    throw new Error(ansi_colors_1.default.red(`请配置output`));
                }
            }
            // eslint-disable-next-line no-undefined
            this.config.format === undefined &&
                (this.config.format = _super.getFormat.call(this, 'YYMMDD'));
        });
    }
    apply(compiler) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.init(compiler);
            if (compiler.hooks) {
                compiler.hooks.afterEmit.tapPromise('WebpackAliOSSPlugin', (compilation) => {
                    return new Promise((resolve, reject) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        // 上传文件总数
                        const uploadCount = Object.keys(compilation.assets).filter((file) => compilation.assets[file].existsAt.includes(this.config.output) &&
                            this.config.exclude &&
                            this.config.exclude.every((reg) => file.search(reg) === -1)).length;
                        // 初始化进度条 正在上传 [==---] 40%
                        const bar = new progress_1.default('正在上传 [:bar] :percent', {
                            total: uploadCount,
                        });
                        // 检测uploadSum变化
                        // eslint-disable-next-line accessor-pairs
                        Object.defineProperty(this, 'uploadSum', {
                            set: function () {
                                bar.tick();
                                if (bar.complete) {
                                    fancy_log_1.default(`\n${ansi_colors_1.default.green.inverse(' DONE ')} ${ansi_colors_1.default.green('upload complete')}\n`);
                                }
                            },
                        });
                        yield this.uploads(compilation);
                        resolve();
                    }));
                });
                // compiler.hooks.done.tapAsync("WebpackAliOSSPlugin", this.upload.bind(this))
            }
            else {
                throw new Error(ansi_colors_1.default.red(`您的Webapck版本过低`));
                // compiler.plugin('afterEmit', this.upload.bind(this))
            }
        });
    }
    uploads(compilation, 
    // eslint-disable-next-line @typescript-eslint/ban-types
    callback
    // eslint-disable-next-line @typescript-eslint/ban-types
    ) {
        const _super = Object.create(null, {
            upload: { get: () => super.upload }
        });
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (typeof compilation === 'undefined') {
                return this.uploadAssets();
            }
            this.assets = compilation.assets;
            yield _super.upload.call(this);
            if (typeof callback === 'function') {
                callback();
            }
        });
    }
}
module.exports = WebpackAliOSSPlugin;
