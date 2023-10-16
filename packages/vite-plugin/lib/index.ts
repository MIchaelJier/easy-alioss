import { normalizePath, ResolvedBuildOptions, Plugin } from 'vite';
import AliOSS, { AliOSSConfig } from '@easy-alioss/core';
import glob from 'glob';
import path from 'path';
import ViteAliOss from './ViteAliOss';

export default function viteAliOssPlugin(options: AliOSSConfig): Plugin {
  let buildConfig: ResolvedBuildOptions;

  return {
    name: 'vite-plugin-easy-alioss',
    enforce: 'post',
    apply: 'build',
    configResolved(config) {
      buildConfig = config.build;
    },
    async closeBundle() {
      const viteAlioss = new ViteAliOss(options, async (options) => {
        const outDirPath = path.join(
          normalizePath(path.resolve(normalizePath(buildConfig.outDir))),
        );
        if (!outDirPath.includes(options.output ?? '')) {
          return '';
        }
        const files = await glob.sync(path.join(outDirPath) + '/**/*', {
          strict: true,
          nodir: true,
          dot: true,
        });

        const assets = files.reduce((pre, curr) => {
          const filePath = curr.split(outDirPath)[1]; // eg: '/assets/vendor.bfb92b77.js'
          return {
            ...pre,
            ...(filePath && {
              [filePath]: curr,
            }),
          };
        }, {});

        viteAlioss.assets = assets;
        return outDirPath;
      });
    },
  };
}

viteAliOssPlugin.getFormat = AliOSS.getFormat;
