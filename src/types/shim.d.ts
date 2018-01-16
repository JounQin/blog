import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import { AxiosInstance } from 'axios'
import Vue, { ComponentOptions } from 'vue'
import { Route } from 'vue-router'
import { Store } from 'vuex'

import { RootState } from 'types'

declare global {
  interface Window {
    __INITIAL_STATE__: RootState
  }
}

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    asyncData?: (
      params: {
        axios: AxiosInstance
        store: Store<RootState>
        route: Route
      },
    ) => any
    title?: string | (() => string)
    validator?: any
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $apollo: ApolloClient<NormalizedCacheObject>
    $http: AxiosInstance
  }

  interface VueConstructor {
    apollo: ApolloClient<NormalizedCacheObject>
    http: AxiosInstance
  }
}

declare module 'vue-translator/dist/esm/translator' {
  export interface Translator {
    toggleLocale?(): void
  }
}
