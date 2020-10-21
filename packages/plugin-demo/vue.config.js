'use strict'
const path = require('path')
const WebpackOssPlugin = require('webpack-yun-oss')
function resolve(dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  outputDir: 'dist',
  lintOnSave: false,
  productionSourceMap: false, // webpack调试
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
      new WebpackOssPlugin()
    ] 
  }
}
