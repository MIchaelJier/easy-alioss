# easy-alioss
A plugin to upload assets to aliyun oss

## 安装 
```bash
# webpack
npm i @easy-alioss/webpack-plugin --save
# vite
npm i @easy-alioss/vite-plugin --save
```
## 参数

# AliOSSConfig

| name | type | optional | default | description |
| - | - | - | - | - |
| accessKeyId | `string` | `false` | `n/a` | 阿里云 accessKeyId |
| accessKeySecret | `string` | `false` | `n/a` | 阿里云 accessKeySecret |
| region | `string` | `false` | `n/a` | 阿里云 region |
| bucket | `string` | `false` | `n/a` | 阿里云 bucket |
| prefix | `string \| undefined` | `true` | `''` | 自定义路径前缀，通常使用项目目录名，文件将存放在alioss的bucket/prefix目录下 |
| exclude | `RegExp \| RegExp[] \| undefined` | `true` | `[/.*\.html$/]` | 可传入正则，或正则组成的数组，来排除上传的文件 |
| deleteAll | `boolean \| undefined` | `true` | `n/a` | 是否删除bucket/prefix中所有文件。优先匹配format配置 |
| local | `boolean \| undefined` | `true` | `false` | 默认每次上传webpack构建流中文件，设为true可上传打包后webpack output指向目录里的文件 |
| output | `string \| undefined` | `true` | `''` | 读取本地目录的路径，如果local为true，output为空，默认为读取webpack输出目录 |
| limit | `number \| undefined` | `true` | `5` | 最多备份版本数量，会备份最近的版本，最小是3。配置了format才会生效 |
| format | `string \| undefined` | `true` | `getFormat('YYMMDD')` | 用时间戳来生成oss目录版本号，每次会保留最近的版本文件做零宕机发布，删除其他版本文件。可以通过插件自身提供的静态方法getFormat()获得，默认值为年月日 |

## 使用

* 实例传参
```javascript
const WebpackAliOSSPlugin = require('@easy-alioss/webpack-plugin')

new WebpackAliOSSPlugin({
  accessKeyId: '2****************9',
  accessKeySecret: 'z**************=',
  region: 'oss-cn-hangzhou',
  bucket: 'xxx',
  prefix: 'test',  
})
```
* 配置文件
```javascript

const WebpackAliOSSPlugin = require('@easy-alioss/webpack-plugin')
const format = WebpackAliOSSPlugin.getFormat('YYYYMMDD') // 默认为getFormat('YYMMDD')
new WebpackAliOSSPlugin({
  format
})

// easy-alioss.config.json
{
  accessKeyId: '2****************9',
  accessKeySecret: 'z**************=',
  region: 'oss-cn-hangzhou',
  bucket: 'xxx',
  prefix: 'test',  
}
```
> 更多格式参考[cosmiconfig](https://github.com/cosmiconfig/cosmiconfig#readme)
> By default, Cosmiconfig will start where you tell it to start and search up the directory tree for the following:
> -  a package.json property
> - a JSON or YAML, extensionless "rc file"
> - an "rc file" with the extensions .json, .yaml, .yml, .js, .ts, .mjs, or .cjs
> - any of the above two inside a .config subdirectory
> - a .config.js, .config.ts, .config.mjs, or .config.cjs file
