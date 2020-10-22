'use strict'
const path = require('path')
const WebpackAliOSSPlugin = require('@gdyfe/webpack-alioss-plugin')
function resolve(dir) {
  return path.join(__dirname, dir)
}
console.log(WebpackAliOSSPlugin.getFormat())
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
      new WebpackAliOSSPlugin()
    ] 
  },
  chainWebpack: config => {
    // DefinePlugin
     config.plugin('define').tap(args => {
       args[0]['run_server'] = 'development'
       return args
     })
  }
}
