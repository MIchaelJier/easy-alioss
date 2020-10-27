import colors from 'ansi-colors'
import log from 'fancy-log'
import AliOSS from './oss'
import ProgressBar from 'progress'
import { Compiler, Assets } from './types'

class WebpackAliOSSPlugin extends AliOSS {
  // constructor(options?: object) {
  //   super(options)
  // }

  async init(compiler: Compiler): Promise<void> {
    await super.init(this.paramOptions)
    if (!this.config.output && this.config.local) {
      const output: string = compiler.outputPath || compiler.options.output.path
      if (output) {
        this.config.output = output
      } else {
        throw new Error(colors.red(`请配置output`))
      }
    }
    // eslint-disable-next-line no-undefined
    this.config.format === undefined &&
      (this.config.format = super.getFormat('YYMMDD'))
  }

  async apply(compiler: Compiler): Promise<void> {
    await this.init(compiler)
    if (compiler.hooks) {
      compiler.hooks.afterEmit.tapPromise(
        'WebpackAliOSSPlugin',
        async (compilation: Assets) => {
          let uploadCount = 0
          await this.uploadLocaleBase(this.config.output, () => {
            uploadCount++
          })
          // const uploadCount: number = Object.keys(compilation.assets).filter(
          //   (file) =>
          //     compilation.assets[file].existsAt.includes(
          //       this.config.local ? this.config.output : ''
          //     ) &&
          //     this.config.exclude.every(
          //       (reg: RegExp) => file.search(reg) === -1
          //     )
          // ).length
          // 初始化进度条 正在上传 [==---] 40%
          const bar: ProgressBar = new ProgressBar('正在上传 [:bar] :percent', {
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
          await this.uploads(compilation)
          return Promise.resolve('finsh')
        }
      )
      // compiler.hooks.done.tapAsync("WebpackAliOSSPlugin", this.upload.bind(this))
    } else {
      throw new Error(colors.red(`您的Webapck版本过低`))
      // compiler.plugin('afterEmit', this.upload.bind(this))
    }
  }

  async uploads(
    compilation: Assets,
    // eslint-disable-next-line @typescript-eslint/ban-types
    callback?: Function
    // eslint-disable-next-line @typescript-eslint/ban-types
  ): Promise<void | Function> {
    if (typeof compilation === 'undefined') {
      return this.uploadAssets()
    }
    this.assets = compilation.assets
    await super.upload()
    if (typeof callback === 'function') {
      callback()
    }
  }
}

export = WebpackAliOSSPlugin
