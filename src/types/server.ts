import { AxiosInstance } from 'axios'
import { Context } from 'koa'
import { Translator } from 'vue-translator'

import { Locale } from 'utils'

export interface ServerContext {
  ctx: Context
  axios: AxiosInstance
  locale: Locale
  script: string
  state: object
  title: string
  translator: Translator
}

export interface SetCookie {
  name: string
  value: string
  path?: string
  expires?: string
  httponly?: boolean
}
