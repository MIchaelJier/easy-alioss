const fs = require('fs')
const colors = require('ansi-colors')
const log = require('fancy-log')
const AliOSS = require('./oss')
const ProgressBar = require('progress')

class WebpackAliOSSPlugin extends AliOSS {
  constructor(options) {
    super(options)
  }

  async init(compiler) {
    await super.init(this.paramOptions)
    // if(!this.config.accessKeyId || !this.config.accessKeySecret) {
    // throw new Error(`请填写正确的accessKeyId、accessKeySecret和bucket`)
    // }
    if (!this.config.output && this.config.local) {
      const output = compiler.outputPath || compiler.options.output.path
      if (output) {
        this.config.output = output
      } else {
        throw new Error(colors.red(`请配置output`))
      }
    }
    this.config.format === undefined &&
      (this.config.format = super.getFormat('YYMMDD'))
  }

  async apply(compiler) {
    await this.init(compiler)
    if (compiler.hooks) {
      compiler.hooks.afterEmit.tapPromise(
        'WebpackAliOSSPlugin',
        (compilation) => {
          return new Promise(async (resolve, reject) => {
            // 上传文件总数
            const uploadCount = Object.keys(compilation.assets).filter(
              (file) =>
                compilation.assets[file].existsAt.includes(
                  this.config.output
                ) &&
                this.config.exclude &&
                this.config.exclude.every((reg) => file.search(reg) === -1)
            ).length
            // 初始化进度条 正在上传 [==---] 40%
            const bar = new ProgressBar('正在上传 [:bar] :percent', {
              total: uploadCount,
            })
            // 检测uploadSum变化
            Object.defineProperty(this, 'uploadSum', {
              set: function () {
                bar.tick()
                if (bar.complete) {
                  log(
                    `\n${colors.green.inverse(' DONE ')} ${colors.green(
                      'upload complete'
                    )}\n`
                  )
                }
              },
            })
            await this.upload()
            resolve()
          })
        }
      )
      // compiler.hooks.done.tapAsync("WebpackAliOSSPlugin", this.upload.bind(this))
    } else {
      throw new Error(colors.red(`您的Webapck版本过低`))
      // compiler.plugin('afterEmit', this.upload.bind(this))
    }
  }

  // async upload(compilation, callback) {
  //   if (typeof compilation === 'undefined') {
  //     return this.uploadAssets()
  //   }
  //   this.assets = compilation.assets
  //   if (this.config.format && !isNaN(Number(this.config.format))) {
  //     await this.delCacheAssets()
  //   } else if (this.config.deleteAll) {
  //     await this.delAllAssets()
  //   } else {
  //     await this.uploadAssets()
  //   }
  //   if (typeof callback === 'function') {
  //     callback()
  //   }
  // }
}
module.exports = WebpackAliOSSPlugin
