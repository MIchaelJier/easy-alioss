const fs = require('fs')
const colors = require('ansi-colors')
const log = require('fancy-log')
const AliOSS = require('./oss')
const ProgressBar = require('progress')

class WebpackAliOSSPlugin extends AliOSS {
  constructor(options) {
    super(options)
  }
  apply(compiler) {
    if (this.config.accessKeyId && this.config.accessKeySecret) {
      if (!this.config.output && this.config.local) {
        const output = compiler.outputPath || compiler.options.output.path
        if (output) {
          this.config.output = output
        } else {
          throw new Error(`请配置配置output`)
        }
      }
      if (compiler.hooks) {
        compiler.hooks.afterEmit.tapPromise(
          'WebpackAliOSSPlugin',
          (compilation) => {
            return new Promise(async (resolve, reject) => {
              const uploadCount =
                Object.keys(compilation.assets).length -
                (this.config.exclude ? this.config.exclude.length : 0)
              const bar = new ProgressBar('正在上传 [:bar] :percent', {
                total: uploadCount,
              })
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
        compiler.plugin('afterEmit', this.upload.bind(this))
      }
    } else {
      log(colors.red(`请填写正确的accessKeyId、accessKeySecret和bucket`))
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
