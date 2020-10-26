"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const ali_oss_1 = tslib_1.__importDefault(require("ali-oss"));
const ansi_colors_1 = tslib_1.__importDefault(require("ansi-colors"));
const fancy_log_1 = tslib_1.__importDefault(require("fancy-log"));
const utils_1 = require("./utils");
const regexp = utils_1.regexp;
class AliOSS {
    constructor(options) {
        this.config = {
            accessKeyId: '',
            accessKeySecret: '',
            region: '',
            bucket: '',
            prefix: '',
            exclude: [],
            deleteAll: false,
            local: false,
            output: '',
            limit: 5,
            format: '',
        };
        this.uploadSum = 0;
        this.assets = {};
        this.paramOptions = options;
    }
    static getFormat(format = 'YYYYMMDDhhmm') {
        return this.getFormat(format);
    }
    // eslint-disable-next-line class-methods-use-this
    getFormat(format = 'YYYYMMDDhhmm') {
        if (!regexp.test(format)) {
            throw new Error(`参数格式由纯数字或YYYY、YY、MM、DD、HH、hh、mm、SS、ss组成`);
        }
        return utils_1.formatDate(new Date(), format);
    }
    init(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const jsonName = 'oss.config.json';
            const hasJson = fs_1.default.existsSync(jsonName);
            let jsonOptions = {};
            try {
                jsonOptions = hasJson
                    ? JSON.parse(fs_1.default.readFileSync(jsonName, 'utf8').toString())
                    : {};
            }
            catch (error) {
                fancy_log_1.default(ansi_colors_1.default.red(`JSON配置有误! reason: ${error}`));
            }
            if (!options && !hasJson) {
                throw new Error(ansi_colors_1.default.red(`请配置插件信息，配置${jsonName}或new时传入参数`));
            }
            if (Object.prototype.toString.call(options) !== '[object Object]' &&
                !hasJson) {
                throw new Error(ansi_colors_1.default.red(`传入配置信息应该是Object`));
            }
            if ([
                'accessKeyId',
                'accessKeySecret',
                'bucket',
                'region',
            ].some((key) => hasJson ? !jsonOptions[key] : !options[key])) {
                throw new Error(ansi_colors_1.default.red(`请填写正确的accessKeyId、accessKeySecret和bucket`));
            }
            this.config = Object.assign({
                prefix: '',
                exclude: [/.*\.html$/],
                deleteAll: false,
                local: true,
                output: '',
                limit: 5,
            }, options, jsonOptions);
            if (this.config.format && !/[0-9]+/.test(this.config.format)) {
                throw new Error(`format应该是纯数字`);
            }
            this.client = new ali_oss_1.default(this.config);
        });
    }
    upload() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.config.format) {
                yield this.delCacheAssets();
            }
            else if (this.config.deleteAll) {
                yield this.delAllAssets();
            }
            else {
                yield this.uploadAssets();
            }
        });
    }
    delFilterAssets(prefix) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const list = [];
                list.push(prefix);
                let result = yield this.client.list({
                    prefix,
                    'max-keys': 1000,
                });
                if (result.objects) {
                    result.objects.forEach((file) => {
                        list.push(file.name);
                    });
                }
                if (Array.isArray(list)) {
                    result = yield this.client.deleteMulti(list, {
                        quiet: true,
                    });
                }
            }
            catch (error) {
                fancy_log_1.default(ansi_colors_1.default.red(`删除缓存文件失败! reason: ${error}`));
            }
        });
    }
    delCacheAssets() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const prefix = this.config.prefix;
            const list = [];
            try {
                const dirList = yield this.client.list({
                    prefix: `${prefix}/`,
                    delimiter: '/',
                });
                if (dirList.prefixes) {
                    dirList.prefixes.forEach((subDir) => {
                        list.push(+subDir.slice(prefix.length + 1, -1));
                    });
                }
                if (list.length > 1) {
                    const limit = this.config.limit > 3 ? this.config.limit - 1 : 2;
                    const array = list
                        .slice()
                        .sort((a, b) => b - a)
                        .slice(limit);
                    yield this.asyncForEach(array, (item) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        yield this.delFilterAssets(`${prefix}/${item}`);
                    }));
                }
                yield this.uploadAssets();
            }
            catch (error) {
                yield this.uploadAssets();
            }
        });
    }
    asyncForEach(arr, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < arr.length; i++) {
                yield cb(arr[i], i);
            }
        });
    }
    delAllAssets() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const { prefix } = this.config;
                let result = yield this.client.list({
                    prefix,
                    'max-keys': 1000,
                });
                if (result.objects) {
                    result = result.objects.map((file) => file.name);
                }
                if (Array.isArray(result)) {
                    result = yield this.client.deleteMulti(result, { quiet: true });
                }
                yield this.uploadAssets();
            }
            catch (error) {
                yield this.uploadAssets();
            }
        });
    }
    uploadAssets() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.config.local) {
                yield this.uploadLocale(this.config.output);
            }
            else {
                yield this.asyncForEach(Object.keys(this.assets), (name) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    if (this.filterFile(name)) {
                        yield this.update(name, Buffer.from(this.assets[name].source(), 'utf8'));
                    }
                }));
            }
        });
    }
    filterFile(name) {
        const { exclude } = this.config;
        return (!exclude ||
            (Array.isArray(exclude) && !exclude.some((item) => item.test(name))) ||
            (!Array.isArray(exclude) && !exclude.test(name)));
    }
    getFileName(name) {
        const { config } = this;
        const prefix = config.format
            ? path_1.default.join(config.prefix, config.format.toString())
            : config.prefix;
        return path_1.default.join(prefix, name).replace(/\\/g, '/');
    }
    update(name, content) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const fileName = this.getFileName(name);
            try {
                const result = yield this.client.put(fileName, content);
                if (+result.res.statusCode === 200) {
                    this.uploadSum++;
                    // log(colors.green(`${fileName}上传成功!`))
                }
                else {
                    fancy_log_1.default(ansi_colors_1.default.red(`${fileName}上传失败!`));
                }
            }
            catch (error) {
                fancy_log_1.default(ansi_colors_1.default.red(`${fileName}上传失败! reason: ${error}`));
            }
        });
    }
    uploadLocale(dir) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.uploadLocaleBase(dir, this.update.bind(this));
        });
    }
    uploadLocaleBase(dir, callback) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const result = fs_1.default.readdirSync(dir);
            yield this.asyncForEach(result, (file) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const filePath = path_1.default.join(dir, file);
                if (this.filterFile(filePath)) {
                    if (fs_1.default.lstatSync(filePath).isDirectory()) {
                        yield this.uploadLocaleBase(filePath, callback);
                    }
                    else {
                        const fileName = filePath.slice(this.config.output.length);
                        if (typeof callback === 'function') {
                            yield callback(fileName, filePath);
                        }
                    }
                }
            }));
        });
    }
}
exports.default = AliOSS;
