import fs from 'fs';
import path from 'path';
import OSS from 'ali-oss';
import colors from 'ansi-colors';
import log from 'fancy-log';
import { cosmiconfigSync } from 'cosmiconfig';

import { regexp as _exp, formatDate, isValidKey } from './utils';
import { AliOSSConfig, ParamOptions } from './types';
const regexp: RegExp = _exp;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class AliOSS<T extends Record<string, any>> {
  config: Required<AliOSSConfig> = {
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
  paramOptions?: ParamOptions;
  uploadSum = 0;
  client!: OSS;
  assets!: T;
  getAssets: (asset: T[string]) => Buffer | string = (a: T) =>
    Buffer.from(a + '', 'utf8');

  constructor(options?: ParamOptions) {
    this.paramOptions = options;
  }

  /**
   * Retrieves the desired format for the date and time.
   *
   * @param {string} format - The format of the date and time. Defaults to 'YYYYMMDDhhmm'.
   *                        The format must be a string consisting of pure numbers or the following placeholders: YYYY, YY, MM, DD, HH, hh, mm, SS, ss.
   * @throws {Error} Throws an error if the format does not match the required pattern.
   * @return {string} The formatted date and time string.
   */
  static getFormat(format = 'YYYYMMDDhhmm'): string {
    if (!regexp.test(format)) {
      throw new Error(
        '参数格式由纯数字或YYYY、YY、MM、DD、HH、hh、mm、SS、ss组成',
      );
    }
    return formatDate(new Date(), format);
  }

  /**
   * Set up the function with the given options.
   *
   * @param {ParamOptions} options - Optional options for the function.
   * @throws {Error} Throws an error if options and JSON configuration are both missing.
   * @throws {Error} Throws an error if options is not an object and JSON configuration is missing.
   * @throws {Error} Throws an error if accessKeyId, accessKeySecret, or bucket are missing in options or JSON configuration.
   * @return {Promise<void>} A promise that resolves when the function is set up.
   */
  async setup(options?: ParamOptions): Promise<void> {
    const fileConfig = cosmiconfigSync('easy-alioss').search();
    const hasJson: boolean = fileConfig !== null;
    let jsonOptions: ParamOptions = {};
    if (fileConfig !== null) {
      jsonOptions = fileConfig.config;
    }
    if (!options && !hasJson) {
      throw new Error(
        colors.red(
          [
            '请配置插件信息:',
            '1. package.json 的easy-alioss属性',
            '2. JSON 或 YAML、无扩展名的“rc 文件”',
            '3. 扩展名为 .json 、.yaml 、 .yml 、 .js 、 .ts 、 .mjs 或 .cjs',
            '4. .config 子目录中的上述两个中的任何一个',
            '5. .config.js 、 .config.ts 、 .config.mjs 或 .config.cjs 文件',
            '6. new 的时候传入参数',
          ].reduce((pre, curr) => pre + '\n' + curr, ''),
        ),
      );
    }
    if (
      Object.prototype.toString.call(options) !== '[object Object]' &&
      !hasJson
    ) {
      throw new Error(colors.red('传入配置信息应该是Object'));
    }
    if (
      ['accessKeyId', 'accessKeySecret', 'bucket', 'region'].some(
        (key: string): boolean =>
          hasJson
            ? isValidKey(key, jsonOptions) &&
              !jsonOptions[key as keyof ParamOptions]
            : isValidKey(key, options as ParamOptions) &&
              !(options as ParamOptions)[key as keyof ParamOptions],
      )
    ) {
      throw new Error(
        colors.red('请填写正确的accessKeyId、accessKeySecret和bucket'),
      );
    }
    this.config = Object.assign(
      {
        prefix: '',
        exclude: [/.*\.html$/],
        deleteAll: false,
        local: true,
        output: '',
        limit: 5,
      },
      options,
      jsonOptions,
    ) as Required<AliOSSConfig>;
    if (this.config.format && !/[0-9]+/.test(this.config.format)) {
      throw new Error('format应该是纯数字');
    }
    this.client = new OSS(this.config);
  }

  /**
   * Uploads assets based on configuration.
   *
   * @returns {Promise<void>} A promise that resolves when the upload is complete.
   */
  async upload(): Promise<void> {
    if (this.config.format) {
      await this.delCacheAssets().catch((err) => {
        log(`\n${colors.red.inverse(' ERROR ')} ${colors.red(err)}\n`);
      });
    } else if (this.config.deleteAll) {
      await this.delAllAssets().catch((err) => {
        log(`\n${colors.red.inverse(' ERROR ')} ${colors.red(err)}\n`);
      });
    } else {
      await this.uploadAssets().catch((err) => {
        log(`\n${colors.red.inverse(' ERROR ')} ${colors.red(err)}\n`);
      });
    }
  }

  /**
   * Deletes filter assets with the given prefix.
   *
   * @param {string | undefined} prefix - The prefix to filter assets by.
   * @return {Promise<void>} A Promise that resolves when the deletion is complete.
   */
  async delFilterAssets(prefix: string | undefined): Promise<void> {
    try {
      const list: Array<string> = [];
      list.push(prefix as string);
      let result: OSS.ListObjectResult | OSS.DeleteMultiResult;
      result = await this.client.list(
        {
          prefix,
          'max-keys': 1000,
        },
        {},
      );
      if ((result as OSS.ListObjectResult).objects) {
        (result as OSS.ListObjectResult).objects.forEach((file) => {
          list.push(file.name);
        });
      }
      if (Array.isArray(list)) {
        result = await this.client.deleteMulti(list, {
          quiet: true,
        });
      }
    } catch (error) {
      log(colors.red(`删除缓存文件失败! reason: ${error}`));
    }
  }

  /**
   * Delete cache assets.
   *
   * @return {Promise<void>} The function does not take any parameters.
   */
  async delCacheAssets(): Promise<void> {
    const prefix: string = this.config.prefix;
    const list: Array<number> = [];
    try {
      const dirList: OSS.ListObjectResult = await this.client.list(
        {
          prefix: `${prefix}/`,
          delimiter: '/',
          'max-keys': 1000,
        },
        {},
      );
      if (dirList.prefixes) {
        dirList.prefixes.forEach((subDir: string) => {
          list.push(+subDir.slice(prefix.length + 1, -1));
        });
      }

      if (list.length > 1) {
        const limit: number = this.config.limit > 3 ? this.config.limit - 1 : 2;
        const array: Array<number> = list
          .slice()
          .sort((a, b) => b - a)
          .slice(limit);
        await this.asyncForEach(array, async (item): Promise<void> => {
          await this.delFilterAssets(`${prefix}/${item}`);
        });
      }
      await this.uploadAssets();
    } catch (error) {
      await this.uploadAssets();
    }
  }

  /**
   * Executes the callback function asynchronously for each element in the given array.
   *
   * @param {Array<unknown>} arr - The array to iterate over.
   * @param {Function} cb - The callback function to execute for each element.
   * @return {Promise<void>} A Promise that resolves when all iterations are complete.
   */
  async asyncForEach<T>(
    arr: Array<T>,
    cb: (a: T, i: number) => Promise<void>,
  ): Promise<void> {
    for (let i = 0; i < arr.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await cb(arr[i], i);
    }
  }

  /**
   * Delete all assets.
   *
   * @return {Promise<void>} A Promise that resolves when all assets are deleted.
   */
  async delAllAssets(): Promise<void> {
    try {
      const { prefix } = this.config;
      let result: OSS.DeleteMultiResult | string[];
      result = await this.client.list(
        {
          prefix,
          'max-keys': 1000,
        },
        {},
      );
      if ((result as OSS.ListObjectResult).objects) {
        result = (result as OSS.ListObjectResult).objects.map(
          (file) => file.name,
        );
      }
      if (Array.isArray(result)) {
        result = await this.client.deleteMulti(result, { quiet: true });
      }
      await this.uploadAssets();
    } catch (error) {
      await this.uploadAssets();
    }
  }

  /**
   * Uploads assets to a remote server or local directory.
   *
   * @return {Promise<void>} A Promise that resolves when the upload is complete.
   */
  async uploadAssets(): Promise<void> {
    if (this.config.local) {
      await this.uploadLocale(this.config.output);
    } else {
      await this.asyncForEach(
        Object.keys(this.assets),
        async (name: string) => {
          if (this.filterFile(name)) {
            await this.update(name, this.getAssets(this.assets[name]));
          }
        },
      );
    }
  }

  /**
   * Filters the file based on the given name.
   *
   * @param {string} name - The name of the file to be filtered.
   * @return {boolean} Returns true if the file should be included, false otherwise.
   */
  filterFile(name: string): boolean {
    const { exclude } = this.config;
    return (
      !exclude ||
      (Array.isArray(exclude) && !exclude.some((item) => item.test(name))) ||
      (!Array.isArray(exclude) && !(exclude as RegExp).test(name))
    );
  }

  /**
   * Returns the file name by joining the prefix and the given name,
   * and replaces backslashes with forward slashes.
   *
   * @param {string} name - The name of the file.
   * @return {string} - The resulting file name.
   */
  getFileName(name: string): string {
    const { config } = this;
    const prefix: string = config.format
      ? path.join(config.prefix, config.format.toString())
      : config.prefix;
    return path.join(prefix, name).replace(/\\/g, '/');
  }

  /**
   * Updates the specified file with the given name and content.
   *
   * @param {string} name - The name of the file to update.
   * @param {string | Buffer} content - The content to update the file with.
   * @return {Promise<void>} - A promise that resolves when the update is complete.
   */
  async update(name: string, content: string | Buffer): Promise<void> {
    const fileName: string = this.getFileName(name);
    try {
      const result = await this.client.put(fileName, content);
      if (+result.res.status === 200) {
        this.uploadSum++;
        // log(colors.green(`${fileName}上传成功!`))
      } else {
        log(colors.red(`${fileName}上传失败!`));
      }
    } catch (error) {
      log(colors.red(`${fileName}上传失败! reason: ${error}`));
    }
  }

  /**
   * Uploads the locale from the specified directory.
   *
   * @param {string} dir - The directory path of the locale to upload.
   * @return {Promise<void>} A Promise that resolves when the locale upload is complete.
   */
  async uploadLocale(dir: string): Promise<void> {
    await this.uploadLocaleBase(dir, this.update.bind(this));
  }

  /**
   * Uploads the locale base from the specified directory.
   *
   * @param {string} dir - The directory path to upload from.
   * @param {function} callback - (Optional) A callback function that will be called for each file uploaded.
   *                             The callback function takes two parameters: fileName (string) and filePath (string).
   *                             It should return a Promise that resolves when the callback is complete.
   * @return {Promise<void>} - A Promise that resolves when the upload is complete.
   */
  async uploadLocaleBase(
    dir: string,
    callback?: (fileName: string, filePath: string) => Promise<void>,
  ): Promise<void> {
    const result: Array<string> = fs.readdirSync(dir);
    await this.asyncForEach(result, async (file: string) => {
      const filePath: string = path.join(dir, file);
      if (this.filterFile(filePath)) {
        if (fs.lstatSync(filePath).isDirectory()) {
          await this.uploadLocaleBase(filePath, callback);
        } else {
          const fileName: string = filePath.slice(this.config.output.length);
          if (typeof callback === 'function') {
            await callback(fileName, filePath);
          }
        }
      }
    });
  }
}

export default AliOSS;
export { AliOSSConfig, ParamOptions, log, colors };
