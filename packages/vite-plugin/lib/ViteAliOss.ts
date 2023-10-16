import AliOSS, { AliOSSConfig, log, colors } from '@easy-alioss/core';
import ProgressBar from 'progress';

type Assets = Record<string, string>;
class ViteAliOss extends AliOSS<Assets> {
  getAssets = (c: Assets[string]) => {
    return c;
  };

  constructor(
    options: AliOSSConfig,
    beforeInit?: (options: AliOSSConfig) => Promise<string>,
  ) {
    super(options);
    this.setup();
    beforeInit?.(this.config)?.then((outDirPath) => {
      outDirPath && this.init(outDirPath);
    });
  }
  async init(outDirPath: string) {
    let uploadCount = 0;
    await this.uploadLocaleBase(outDirPath, async () => {
      uploadCount++;
    });

    const bar: ProgressBar = new ProgressBar('正在上传 [:bar] :percent', {
      total: uploadCount,
      complete: '█',
      incomplete: '░',
      width: 100,
    });
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
    this.upload();
  }
}

export default ViteAliOss;
