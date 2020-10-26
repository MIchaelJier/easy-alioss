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

export type ParamOptions = {
  [propName in keyof AliOSSConfig]?: AliOSSConfig[propName]
}

export interface Assets {
  [propName: string]: any
}

export interface Compiler {
  [propName: string]: any
}
