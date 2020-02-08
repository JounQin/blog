import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import { AxiosInstance } from 'axios'
import Vue, { ComponentOptions } from 'vue'
import { Translator } from 'vue-translator'

import { Translate, TranslateCacheData } from 'plugins'
import { Apollo, AsyncDataFn, RootState } from 'types'

declare global {
  interface Window {
    __APOLLO_CACHE__: NormalizedCacheObject
    __STORE_STATE__: RootState
    __TRANSLATE_CACHE__: TranslateCacheData
  }
}

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    asyncData?: AsyncDataFn
    title?: string | ((vm: V) => string)
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $apollo: Apollo
    $http: AxiosInstance
    $t: Translator
    $tt: Translate
  }
}

declare module 'vue-translator/lib/translator' {
  export interface Translator {
    toggleLocale?(): void
  }
}
