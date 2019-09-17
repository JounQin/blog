import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import { ApolloClient } from 'apollo-client'
import { AxiosInstance } from 'axios'
import { Route } from 'vue-router'
import { Store } from 'vuex'

import { RootState } from './store'

import { Translate } from 'plugins'

// eslint-disable-next-line @typescript-eslint/no-type-alias
export type Apollo = ApolloClient<NormalizedCacheObject>

export interface AsyncData {
  apollo?: Apollo
  axios?: AxiosInstance
  store?: Store<RootState>
  route?: Route
  translate?: Translate
}

export type AsyncDataFn<T = unknown> = (params: AsyncData) => T
