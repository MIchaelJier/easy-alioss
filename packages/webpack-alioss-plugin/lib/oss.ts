import fs from 'fs'
import path from 'path'
import OSS from 'ali-oss'
import colors from 'ansi-colors'
import log from 'fancy-log'
import { regexp as _exp, formatDate } from './utils'
import { AliOSSConfig } from './types'
const regexp: RegExp = _exp
// const fs: any = require('fs')
// const path: any = require('pathƒ')
// const OSS: any = require('ali-oss')
// const colors: any = require('ansi-colors')
// const log: any = require('fancy-log')
// const utils: any = require('./utils')
// const { AliOSSConfig } = require('./types')
// const regexp: any = regexp

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
  paramOptions?: object
  uploadSum = 0
  client: any
  assets: object = {}

  constructor(options?: object) {
    this.paramOptions = options
  }

  static getFormat(format = 'YYYYMMDDhhmm'): string {
    return this.getFormat(format)
  }

  // eslint-disable-next-line class-methods-use-this
  getFormat(format = 'YYYYMMDDhhmm'): string {
    if (!regexp.test(format)) {
      throw new Error(
        `参数格式由纯数字或YYYY、YY、MM、DD、HH、hh、mm、SS、ss组成`
      )
    }
    return formatDate(new Date(), format)
  }

  async init(options?: object): Promise<void> {
    const jsonName = 'oss.config.json'
    const hasJson: boolean = fs.existsSync(jsonName)
    let jsonOptions: object = {}

    try {
      jsonOptions = hasJson
        ? JSON.parse(fs.readFileSync(jsonName, 'utf8').toString())
        : {}
    } catch (error) {
      log(colors.red(`JSON配置有误! reason: ${error}`))
    }
    if (!options && !hasJson) {
      throw new Error(
        colors.red(`请配置插件信息，配置${jsonName}或new时传入参数`)
      )
    }
    if (
      Object.prototype.toString.call(options) !== '[object Object]' &&
      !hasJson
    ) {
      throw new Error(colors.red(`传入配置信息应该是Object`))
    }
    if (
      ['accessKeyId', 'accessKeySecret', 'bucket', 'region'].some((key) =>
        hasJson ? !jsonOptions[key] : !(options as object)[key]
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
      await this.delCacheAssets()
    } else if (this.config.deleteAll) {
      await this.delAllAssets()
    } else {
      await this.uploadAssets()
    }
  }

  async delFilterAssets(prefix: string): Promise<void> {
    try {
      const list: Array<string> = []
      list.push(prefix)
      let result: any = await this.client.list({
        prefix,
        'max-keys': 1000,
      })
      if (result.objects) {
        result.objects.forEach((file) => {
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
    const list: Array<any> = []
    try {
      const dirList: any = await this.client.list({
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
        const array: Array<any> = list
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

  async asyncForEach(arr: Array<any>, cb: Function): Promise<void> {
    for (let i = 0; i < arr.length; i++) {
      await cb(arr[i], i)
    }
  }

  async delAllAssets(): Promise<void> {
    try {
      const { prefix } = this.config
      let result: any = await this.client.list({
        prefix,
        'max-keys': 1000,
      })
      if (result.objects) {
        result = result.objects.map((file) => file.name)
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

  filterFile(name: string) {
    const { exclude } = this.config
    return (
      !exclude ||
      (Array.isArray(exclude) && !exclude.some((item) => item.test(name))) ||
      (!Array.isArray(exclude) && !(exclude as any).test(name))
    )
  }

  getFileName(name: string): string {
    const { config } = this
    const prefix: string = config.format
      ? path.join(config.prefix, config.format.toString())
      : config.prefix
    return path.join(prefix, name).replace(/\\/g, '/')
  }

  async update(name: string, content: any): Promise<void> {
    const fileName: string = this.getFileName(name)
    try {
      const result: any = await this.client.put(fileName, content)
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
    const result: any = fs.readdirSync(dir)
    await this.asyncForEach(result, async (file: string) => {
      const filePath: string = path.join(dir, file)
      if (this.filterFile(filePath)) {
        if (fs.lstatSync(filePath).isDirectory()) {
          await this.uploadLocale(filePath)
        } else {
          const fileName: string = filePath.slice(this.config.output.length)
          await this.update(fileName, filePath)
        }
      }
    })
  }
}

// module.exports = AliOSS
export default AliOSS
