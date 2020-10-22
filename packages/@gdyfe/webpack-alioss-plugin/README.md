# webpack-yun-oss
A webpack plugin to upload assets to aliyun oss

## 安装 
```
npm i @gdyfe/webpack-alioss-plugin --save
yarn add gdy-rrweb-plugin -D
```
## 参数
| 选项名          | 类型                 | 是否必填 | 默认值 | 描述                                                                                                                                 |
| :-------------- | :------------------- | :------- | :----- | :----------------------------------------------------------------------------------------------------------------------------------- |
| accessKeyId     | String               | √        |        | 阿里云accessKeyId                                                                                                                    |
| accessKeySecret | String               | √        |        | 阿里云accessKeySecret                                                                                                                |
| region          | String               | √        |        | 阿里云region                                                                                                                         |
| bucket          | String               | √        |        | 阿里云bucket                                                                                                                         |
| prefix          | String               | √        |        | 自定义路径前缀，通常使用项目目录名，文件将存放在alioss的bucket/prefix目录下                                                          |
| format          | Number               | ×        | getFormat('YYYYMMDD')     | 可用时间戳来生成oss目录版本号，每次会保留最近的版本文件做零宕机发布，删除其他版本文件。可以通过插件自身提供的静态方法getFormat()获得，默认值为年月日 |
| limit           | Number               | ×        | 5      | 最多备份版本数量，会备份最近的版本，最小是3。配置了format才会生效                                                                    |
| deleteAll       | Boolean              | ×        | false   | 是否删除bucket/prefix中所有文件。优先匹配format配置                                                                                  |
| local           | Boolean              | ×        | true  | 默认每次上传webpack构建流中文件，设为true可上传打包后webpack output指向目录里的文件                                                  |
| output          | String               | ×        | ''     | 读取本地目录的路径，如果local为true，output为空，默认为读取webpack输出目录                                                           |
| exclude         | ExpReg/Array<ExpReg> | ×        |  [/.*\.html$/]  | 可传入正则，或正则组成的数组，来排除上传的文件                                                                                       |

## 使用

* 实例传参
```javascript
const WebpackAliOSSPlugin = require('@gdyfe/webpack-alioss-plugin')

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

const WebpackAliOSSPlugin = require('@gdyfe/webpack-alioss-plugin')
const format = WebpackAliOSSPlugin.getFormat('YYMMDD')
new WebpackAliOSSPlugin({
  format
})

// oss.config.json
{
  accessKeyId: '2****************9',
  accessKeySecret: 'z**************=',
  region: 'oss-cn-hangzhou',
  bucket: 'xxx',
  prefix: 'test',  
}
```