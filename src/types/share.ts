import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import { ApolloClient } from 'apollo-client'
import { AxiosInstance } from 'axios'
import { Route } from 'vue-router'
import { Store } from 'vuex'

import { RootState } from './store'

export interface AsyncData {
  apollo?: ApolloClient<NormalizedCacheObject>
  axios?: AxiosInstance
  store?: Store<RootState>
  route?: Route
}

export type AsyncDataFn<T = any> = (params: AsyncData) => T
