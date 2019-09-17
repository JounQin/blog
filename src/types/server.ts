import { AxiosInstance } from 'axios'
import { Translator } from 'vue-translator'

import { Context } from 'koa'
import { Locale } from 'types'

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
