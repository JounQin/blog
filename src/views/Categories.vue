<template lang="pug">
main
  h4.my-5.text-center {{ $t('total_categories_count', [labels.length]) }}
  ul.list-unstyled
    router-link.d-inline-flex.mx-2.my-2(v-for="{color, id, name} of labels"
                                        tag="li"
                                        :key="id"
                                        :to="{ path: '/', query: { labels: name } }"
                                        :style="{ backgroundColor: color }")
      a.px-3.py-1.small(:style="{ color: invertColor(color) }") {{ name }}
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { State } from 'vuex-class'

import { Label, Repository } from 'types'
import { REPOSITORY, invertColor } from 'utils'

import * as querires from 'queries.gql'

@Component({
  async asyncData({ store }) {
    const { data } = await Vue.apollo.query<{
      repository: Repository
    }>({
      query: querires.categories,
      variables: REPOSITORY,
    })
    store.commit('SET_LABELS', data.repository.labels.nodes)
  },
  translator: {
    en: {
      total_categories_count: 'There are { 0 } categories totally now',
    },
    zh: {
      total_categories_count: '目前共计 { 0 } 个分类',
    },
  },
})
export default class Categories extends Vue {
  @State('labels') labels: Label[]

  invertColor = invertColor
}
</script>
