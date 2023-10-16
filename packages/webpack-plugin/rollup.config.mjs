import typescript from '@rollup/plugin-typescript';
import { babel } from '@rollup/plugin-babel';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import json from '@rollup/plugin-json';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { defineConfig } from 'rollup';
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url)),
);

const banner = `/*!
  * ${pkg.name} v${pkg.version}
  * (c) ${new Date().getFullYear()} MichaelJier
  * @license MIT
  */`;
const baseConfig = ({ typescriptOptions, ...output }) =>
  defineConfig({
    input: 'lib/index.ts',
    output,
    plugins: [
      typescript(typescriptOptions),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        extensions: [...DEFAULT_EXTENSIONS, '.ts'],
      }),
      json(),
    ],
  });
export default [
  {
    dir: dirname(pkg.module),
    format: 'esm',
    banner,
    name: 'EasyAliossWebpackPlugin',
    typescriptOptions: {
      outDir: dirname(pkg.module),
    },
  },
  {
    dir: dirname(pkg.main),
    format: 'cjs',
    banner,
    name: 'EasyAliossWebpackPlugin',
    typescriptOptions: {
      outDir: dirname(pkg.main),
    },
  },
].map((item) => baseConfig(item));
