'use strict'
const path = require('path')
const WebpackAliOSSPlugin = require('@easy-alioss/webpack-plugin')
const format = WebpackAliOSSPlugin.getFormat('YYMMDD')

function resolve(dir) {
  return path.join(__dirname, dir)
}
module.exports = {
  outputDir: 'dist',
  lintOnSave: false,
  productionSourceMap: false,
  devServer: {
    port: 8080,
    open: true,
    overlay: {
      warnings: false,
      errors: true
    }
  },
  configureWebpack: {
    name: 'plugin-test',
    resolve: {
      alias: {
        '@': resolve('src')
      }
    },
    plugins: [
      // 如果没有配置 easy-alioss.config.js , 需要传入参数
      // new WebpackAliOSSPlugin({...})
      new WebpackAliOSSPlugin()
    ]
  },
  chainWebpack: config => {
    config.plugin('define').tap(args => {
      args[0]['run_server'] = 'development'
      return args
    })
  }
}
