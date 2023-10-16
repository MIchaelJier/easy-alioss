import OSS from 'ali-oss';

export type DeepPartial<T> = {
  [U in keyof T]?: T[U] extends object ? DeepPartial<T[U]> : T[U];
};

export interface AliOSSConfig {
  /** 阿里云 accessKeyId */
  accessKeyId: string;
  /** 阿里云 accessKeySecret */
  accessKeySecret: string;
  /** 阿里云 region  */
  region: string;
  /** 阿里云 bucket */
  bucket: string;
  /** 自定义路径前缀，通常使用项目目录名，文件将存放在alioss的bucket/prefix目录下
   * @default ''
   */
  prefix?: string;
  /** 可传入正则，或正则组成的数组，来排除上传的文件
   * @default [/.*\.html$/]
   */
  exclude?: Array<RegExp> | RegExp;
  /** 是否删除bucket/prefix中所有文件。优先匹配format配置 */
  deleteAll?: boolean;
  /** 默认每次上传webpack构建流中文件，设为true可上传打包后webpack output指向目录里的文件
   * @default false
   */
  local?: boolean;
  /** 读取本地目录的路径，如果local为true，output为空，默认为读取webpack输出目录
   * @default ''
   */
  output?: string;
  /** 最多备份版本数量，会备份最近的版本，最小是3。配置了format才会生效
   * @default 5
   */
  limit?: number;
  /** 用时间戳来生成oss目录版本号，每次会保留最近的版本文件做零宕机发布，删除其他版本文件。可以通过插件自身提供的静态方法getFormat()获得，默认值为年月日
   * @default getFormat('YYMMDD')
   */
  format?: string;
}

export type ParamOptions = Partial<AliOSSConfig>;

export type Alioss = Partial<OSS>;
