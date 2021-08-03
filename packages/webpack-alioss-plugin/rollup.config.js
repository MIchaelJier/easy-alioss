import typescript from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve' // 外部模块
import builtins from 'builtin-modules'
import pkg from './package.json'
// import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
// const extensions = ['.js', '.jsx', '.ts', '.tsx']

const plugins = [
  terser({
    compress: {
      ecma: 2015,
      pure_getters: true,
    },
  }),
]

export default [
  {
    input: 'lib/index.ts',
    external: [...builtins, ...Object.keys(pkg.dependencies)],
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({
        tsconfig: 'tsconfig.json',
        tsconfigOverride: {
          compilerOptions: {
            module: 'ESNext',
          },
        },
      }),
      json(),
      // babel({
      //   exclude: 'node_modules/**',
      //   extensions,
      // }),
    ],
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        exports: 'auto',
        plugins,
      },
    ],
  },
]
