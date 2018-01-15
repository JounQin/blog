import { AxiosInstance } from 'axios'
import { Context } from 'koa'

export interface ServerContext {
  ctx: Context
  axios: AxiosInstance
  state: object
  title: string
}
