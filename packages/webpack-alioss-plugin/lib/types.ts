import OSS from 'ali-oss'

export type DeepPartial<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [U in keyof T]?: T[U] extends object ? DeepPartial<T[U]> : T[U]
}

export interface AliOSSConfig {
  // extends paramConfig
  accessKeyId: string
  accessKeySecret: string
  region: string
  bucket: string
  prefix: string
  exclude: Array<RegExp>
  deleteAll: boolean
  local: boolean
  output: string
  limit: number
  format: string
}

export type ParamOptions = Partial<AliOSSConfig>

export type Alioss = {
  [propName in keyof OSS]?: OSS[propName] | any
}

export interface Assets {
  [propName: string]: any
}

export interface Compiler {
  [propName: string]: any
}
