/* eslint-disable class-methods-use-this */
import fs from 'fs'
import path from 'path'
import OSS from 'ali-oss'
import colors from 'ansi-colors'
import log from 'fancy-log'
import { cosmiconfigSync } from 'cosmiconfig'

import { regexp as _exp, formatDate, isValidKey } from './utils'
import { AliOSSConfig, ParamOptions, Assets, Alioss } from './types'
const regexp: RegExp = _exp
const FILE_FIRSTNAME = 'oss'
const FILE_ALLOW_NAMES = [
  `${FILE_FIRSTNAME}.config.js`,
  `${FILE_FIRSTNAME}.config.json`,
]

class AliOSS {
  config: AliOSSConfig = {
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
  }
  paramOptions?: ParamOptions
  uploadSum = 0
  client: Alioss = {}
  assets: Assets = {}

  constructor(options?: ParamOptions) {
    this.paramOptions = options
  }

  static getFormat(format = 'YYYYMMDDhhmm'): string {
    if (!regexp.test(format)) {
      throw new Error(
        `参数格式由纯数字或YYYY、YY、MM、DD、HH、hh、mm、SS、ss组成`
      )
    }
    return formatDate(new Date(), format)
  }

  async init(options?: ParamOptions): Promise<void> {
    const searchPlaces = FILE_ALLOW_NAMES
    // cosmiconfig 获取congfig
    const fileConfig = cosmiconfigSync('user-config', {
      searchPlaces,
    }).search()
    const hasJson: boolean = fileConfig !== null
    let jsonOptions: ParamOptions = {}
    if (fileConfig !== null) {
      jsonOptions = fileConfig.config
    } else {
      log(colors.red(`JSON配置有误!`))
    }
    if (!options && !hasJson) {
      throw new Error(
        colors.red(
          `请配置插件信息，配置${JSON.stringify(FILE_ALLOW_NAMES).replace(
            // eslint-disable-next-line no-useless-escape
            /\"|\'|]|\[/g,
            ''
          )}或new时传入参数`
        )
      )
    }
    if (
      Object.prototype.toString.call(options) !== '[object Object]' &&
      !hasJson
    ) {
      throw new Error(colors.red(`传入配置信息应该是Object`))
    }
    if (
      ['accessKeyId', 'accessKeySecret', 'bucket', 'region'].some(
        (key: string): boolean =>
          // eslint-disable-next-line prettier/prettier
        (hasJson ? isValidKey(key, jsonOptions) && !jsonOptions[key] : isValidKey(key, options as ParamOptions) && !(options as ParamOptions)[key])
      )
    ) {
      throw new Error(
        colors.red(`请填写正确的accessKeyId、accessKeySecret和bucket`)
      )
    }
    this.config = Object.assign(
      {
        prefix: '',
        exclude: [/.*\.html$/],
        deleteAll: false,
        local: true,
        output: '',
        limit: 5,
        // bucket: `guangdianyun-static-${process.env.run_server || process.env.NODE_ENV}`
      },
      options,
      jsonOptions
    ) as AliOSSConfig
    if (this.config.format && !/[0-9]+/.test(this.config.format)) {
      throw new Error(`format应该是纯数字`)
    }
    this.client = new OSS(this.config)
  }

  async upload(): Promise<void> {
    if (this.config.format) {
      await this.delCacheAssets().catch((err) => {
        log(`\n${colors.red.inverse(' ERROR ')} ${colors.red(err)}\n`)
      })
    } else if (this.config.deleteAll) {
      await this.delAllAssets().catch((err) => {
        log(`\n${colors.red.inverse(' ERROR ')} ${colors.red(err)}\n`)
      })
    } else {
      await this.uploadAssets().catch((err) => {
        log(`\n${colors.red.inverse(' ERROR ')} ${colors.red(err)}\n`)
      })
    }
  }

  async delFilterAssets(prefix: string | undefined): Promise<void> {
    try {
      const list: Array<string> = []
      list.push(prefix as string)
      let result = await this.client.list({
        prefix,
        'max-keys': 1000,
      })
      if (result.objects) {
        // eslint-disable-next-line prettier/prettier
        result.objects.forEach((file: any) => {
          list.push(file.name)
        })
      }
      if (Array.isArray(list)) {
        result = await this.client.deleteMulti(list, {
          quiet: true,
        })
      }
    } catch (error) {
      log(colors.red(`删除缓存文件失败! reason: ${error}`))
    }
  }

  async delCacheAssets(): Promise<void> {
    const prefix: string = this.config.prefix
    const list: Array<number> = []
    try {
      const dirList: OSS.ListObjectResult = await this.client.list({
        prefix: `${prefix}/`,
        delimiter: '/',
      })
      if (dirList.prefixes) {
        dirList.prefixes.forEach((subDir: string) => {
          list.push(+subDir.slice(prefix.length + 1, -1))
        })
      }

      if (list.length > 1) {
        const limit: number = this.config.limit > 3 ? this.config.limit - 1 : 2
        const array: Array<number> = list
          .slice()
          .sort((a, b) => b - a)
          .slice(limit)
        await this.asyncForEach(
          array,
          async (item: string): Promise<void> => {
            await this.delFilterAssets(`${prefix}/${item}`)
          }
        )
      }
      await this.uploadAssets()
    } catch (error) {
      await this.uploadAssets()
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  async asyncForEach(arr: Array<unknown>, cb: Function): Promise<void> {
    for (let i = 0; i < arr.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await cb(arr[i], i)
    }
  }

  async delAllAssets(): Promise<void> {
    try {
      const { prefix } = this.config
      let result = await this.client.list({
        prefix,
        'max-keys': 1000,
      })
      if ((result as OSS.ListObjectResult).objects) {
        result = result.objects.map((file: any) => file.name)
      }
      if (Array.isArray(result)) {
        result = await this.client.deleteMulti(result, { quiet: true })
      }
      await this.uploadAssets()
    } catch (error) {
      await this.uploadAssets()
    }
  }

  async uploadAssets(): Promise<void> {
    if (this.config.local) {
      await this.uploadLocale(this.config.output)
    } else {
      await this.asyncForEach(
        Object.keys(this.assets),
        async (name: string) => {
          if (this.filterFile(name)) {
            await this.update(
              name,
              Buffer.from(this.assets[name].source(), 'utf8')
            )
          }
        }
      )
    }
  }

  filterFile(name: string): boolean {
    const { exclude } = this.config
    return (
      !exclude ||
      (Array.isArray(exclude) && !exclude.some((item) => item.test(name))) ||
      // eslint-disable-next-line @typescript-eslint/ban-types
      (!Array.isArray(exclude) && !(exclude as { test: Function }).test(name))
    )
  }

  getFileName(name: string): string {
    const { config } = this
    const prefix: string = config.format
      ? path.join(config.prefix, config.format.toString())
      : config.prefix
    return path.join(prefix, name).replace(/\\/g, '/')
  }

  async update(name: string, content: string | Buffer): Promise<void> {
    const fileName: string = this.getFileName(name)
    try {
      const result = await this.client.put(fileName, content)
      if (+result.res.statusCode === 200) {
        this.uploadSum++
        // log(colors.green(`${fileName}上传成功!`))
      } else {
        log(colors.red(`${fileName}上传失败!`))
      }
    } catch (error) {
      log(colors.red(`${fileName}上传失败! reason: ${error}`))
    }
  }

  async uploadLocale(dir: string): Promise<void> {
    await this.uploadLocaleBase(dir, this.update.bind(this))
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  async uploadLocaleBase(dir: string, callback?: Function): Promise<void> {
    const result: Array<string> = fs.readdirSync(dir)
    await this.asyncForEach(result, async (file: string) => {
      const filePath: string = path.join(dir, file)
      if (this.filterFile(filePath)) {
        if (fs.lstatSync(filePath).isDirectory()) {
          await this.uploadLocaleBase(filePath, callback)
        } else {
          const fileName: string = filePath.slice(this.config.output.length)
          if (typeof callback === 'function') {
            await callback(fileName, filePath)
          }
        }
      }
    })
  }
}

export default AliOSS
