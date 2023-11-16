import { AxiosInstance } from 'axios'
import { Context } from 'koa'
import { Translator } from 'vue-translator'

import { Translate } from 'plugins'
import { Apollo, Locale } from 'types'

export interface ServerContext {
  ctx: Context
  apollo: Apollo
  axios: AxiosInstance
  locale: Locale
  script: string
  state: object
  title: string
  translator: Translator
  translate: Translate
}

export interface SetCookie {
  name: string
  value: string
  path?: string
  expires?: string
  httponly?: boolean
}
