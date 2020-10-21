const fs = require('fs')
const path = require('path')
// const { Worker } = require('webworker-threads')
const OSS = require('ali-oss')
const colors = require('ansi-colors')
const log = require('fancy-log')
const utils = require('./utils')
const regexp = utils.regexp

class AliOSS {
  constructor(options = {}) {
    this.init(options)
    const upload = this.upload
    // this.worker = new Worker(function(){
    //   this.upload = upload
    // })
  }

  getFormat(format = 'YYYYMMDDhhmm') {
    if (!regexp.test(format)) {
      throw new Error(
        `参数格式由纯数字或YYYY、YY、MM、DD、HH、hh、mm、SS、ss组成`
      )
    }
    return utils.formatDate(new Date(), format)
  }

  async init(options) {
    if (Object.prototype.toString.call(options) !== '[object Object]') {
      throw new Error(`配置信息应该是Object`)
    }
    const jsonName = 'oss.config.json'
    const format = this.getFormat('YYYYMMDDhhmmSSss')
    const hasJson = await fs.existsSync(jsonName)
    let jsonOptions = hasJson 
    ? JSON.parse(
      (await fs.readFileSync(jsonName, 'utf8')).toString()
    )
    : {}
    this.uploadSum = 0
    this.config = Object.assign(
      {
        prefix: '',
        exclude: [/.*\.html$/],
        format,
        deleteAll: false,
        output: '',
        local: true,
        limit: 5,
      },
      options,
      jsonOptions
    )
    if (
      ['accessKeyId', 'accessKeySecret', 'bucket', 'region'].some(
        (key) => !options[key] && !jsonOptions[key]
      )
    ) {
      throw new Error(`请填写正确的accessKeyId、accessKeySecret和bucket`)
    }
    if (this.config.format && !/[0-9]+/.test(this.config.format)) {
      throw new Error(`format应该是纯数字`)
    }
    this.client = new OSS(this.config)
  }

  async upload() {
    if (this.config.format) {
      await this.delCacheAssets()
    } else if (this.config.deleteAll) {
      await this.delAllAssets()
    } else {
      await this.uploadAssets()
    }
  }

  async delFilterAssets(prefix) {
    try {
      const list = []
      list.push(prefix)
      let result = await this.client.list({
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
      log(colors.red(`删除缓存文件失败!`))
    }
  }

  async delCacheAssets() {
    const prefix = this.config.prefix
    const list = []
    try {
      const dirList = await this.client.list({
        prefix: `${prefix}/`,
        delimiter: '/',
      })
      if (dirList.prefixes) {
        dirList.prefixes.forEach((subDir) => {
          list.push(+subDir.slice(prefix.length + 1, -1))
        })
      }

      if (list.length > 1) {
        const limit = this.config.limit > 3 ? this.config.limit - 1 : 2
        const array = list
          .slice()
          .sort((a, b) => b - a)
          .slice(limit)
        await this.asyncForEach(array, async (item, index) => {
          await this.delFilterAssets(`${prefix}/${item}`)
        })
      }

      await this.uploadAssets()
    } catch (error) {
      await this.uploadAssets()
    }
  }

  async asyncForEach(arr, cb) {
    for (let i = 0; i < arr.length; i++) {
      await cb(arr[i], i)
    }
  }

  async delAllAssets() {
    try {
      const { prefix } = this.config
      let result = await this.client.list({
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

  async uploadAssets() {
    if (this.config.local) {
      await this.uploadLocale(this.config.output)
    } else {
      await this.asyncForEach(Object.keys(this.assets), async (name, index) => {
        if (this.filterFile(name)) {
          await this.update(
            name,
            Buffer.from(this.assets[name].source(), 'utf8')
          )
        }
      })
    }
  }

  filterFile(name) {
    const { exclude } = this.config
    return (
      !exclude ||
      (Array.isArray(exclude) && !exclude.some((item) => item.test(name))) ||
      (!Array.isArray(exclude) && !exclude.test(name))
    )
  }

  getFileName(name) {
    const { config } = this
    const prefix = config.format
      ? path.join(config.prefix, config.format.toString())
      : config.prefix
    return path.join(prefix, name).replace(/\\/g, '/')
  }

  async update(name, content) {
    const fileName = this.getFileName(name)
    try {
      const result = await this.client.put(fileName, content)
      if (+result.res.statusCode === 200) {
        this.uploadSum++
        // log(colors.green(`${fileName}上传成功!`))
      } else {
        log(colors.red(`${fileName}上传失败!`))
      }
    } catch (error) {
      log(colors.red(`${fileName}上传失败!, reason: ${error}`))
    }
  }

  async uploadLocale(dir) {
    const result = fs.readdirSync(dir)
    await this.asyncForEach(result, async (file) => {
      const filePath = path.join(dir, file)
      if (this.filterFile(filePath)) {
        if (fs.lstatSync(filePath).isDirectory()) {
          await this.uploadLocale(filePath)
        } else {
          const fileName = filePath.slice(this.config.output.length)
          await this.update(fileName, filePath)
        }
      }
    })
  }
}

module.exports = AliOSS
