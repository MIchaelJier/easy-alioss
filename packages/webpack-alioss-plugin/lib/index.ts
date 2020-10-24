import colors from 'ansi-colors'
import log from 'fancy-log'
import AliOSS from './oss'
import ProgressBar from 'progress'
// const colors: any = require('ansi-colors')
// const log: any = require('fancy-log')
// const AliOSS: any = require('./oss')
// const ProgressBar: any = require('progress')

export class WebpackAliOSSPlugin extends AliOSS {
  constructor(options?: object) {
    super(options)
  }

  async init(compiler: any): Promise<void> {
    await super.init(this.paramOptions)
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

  async apply(compiler: any): Promise<void> {
    await this.init(compiler)
    if (compiler.hooks) {
      compiler.hooks.afterEmit.tapPromise(
        'WebpackAliOSSPlugin',
        (compilation: any) => {
          return new Promise(async (resolve, reject) => {
            // 上传文件总数
            const uploadCount: number = Object.keys(compilation.assets).filter(
              (file) =>
                compilation.assets[file].existsAt.includes(
                  this.config.output
                ) &&
                this.config.exclude &&
                this.config.exclude.every(
                  (reg: RegExp) => file.search(reg) === -1
                )
            ).length
            // 初始化进度条 正在上传 [==---] 40%
            const bar: any = new ProgressBar('正在上传 [:bar] :percent', {
              total: uploadCount,
            })
            // 检测uploadSum变化
            // eslint-disable-next-line accessor-pairs
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
