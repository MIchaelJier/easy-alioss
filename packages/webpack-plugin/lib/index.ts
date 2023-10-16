import colors from 'ansi-colors';
import AliOSS, { log } from '@easy-alioss/core';
import ProgressBar from 'progress';
import { Compiler, Compilation } from 'webpack';

class WebpackAliOSSPlugin extends AliOSS<Compilation['assets']> {
  getAssets = (c: Compilation['assets'][string]) => {
    const source = c.source();
    if (typeof source === 'string') {
      return Buffer.from(source, 'utf8');
    }
    return source;
  };

  async init(compiler: Compiler): Promise<void> {
    await super.setup(this.paramOptions);
    if (!this.config.output && this.config.local) {
      const output: string | undefined =
        compiler.outputPath || compiler.options.output.path;
      if (output) {
        this.config.output = output;
      } else {
        throw new Error(colors.red('请配置output'));
      }
    }
    this.config.format === void 0 &&
      (this.config.format = WebpackAliOSSPlugin.getFormat('YYMMDD'));
  }

  async apply(compiler: Compiler): Promise<void> {
    await this.init(compiler);
    if (compiler.hooks) {
      compiler.hooks.afterEmit.tapPromise(
        'EasyAliossWebpackPlugin',
        async (compilation: Compilation) => {
          let uploadCount = 0;
          await this.uploadLocaleBase(this.config.output, async () => {
            uploadCount++;
          });
          const bar: ProgressBar = new ProgressBar('正在上传 [:bar] :percent', {
            total: uploadCount,
            complete: '█',
            incomplete: '░',
            width: 100,
          });
          // 检测uploadSum变化
          Object.defineProperty(this, 'uploadSum', {
            set: function () {
              bar.tick();
              if (bar.complete) {
                log(
                  `\n${colors.green.inverse(' DONE ')} ${colors.green(
                    'upload complete',
                  )}\n`,
                );
              }
            },
          });
          await this.uploads(compilation);
          return Promise.resolve();
        },
      );
      // compiler.hooks.done.tapAsync("WebpackAliOSSPlugin", this.upload.bind(this))
    } else {
      throw new Error(colors.red('您的Webapck版本过低'));
      // compiler.plugin('afterEmit', this.upload.bind(this))
    }
  }

  async uploads(
    compilation: Compilation,
    callback?: () => void,
  ): Promise<void> {
    if (typeof compilation === 'undefined') {
      return this.uploadAssets();
    }
    this.assets = compilation.assets;
    await super.upload();
    if (typeof callback === 'function') {
      callback();
    }
  }
}

export default WebpackAliOSSPlugin;
