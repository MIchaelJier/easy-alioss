import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve' // 外部模块
import builtins from 'builtin-modules'
import pkg from './package.json'

export default [
  {
    input: 'lib/index.ts',
    external: builtins,
    plugins: [
      nodeResolve(),
      commonjs({
        include: 'node_modules/**',
      }),
      json(),
      typescript(),
    ],
    output: [{ file: pkg.main, format: 'cjs' }],
  },
]
