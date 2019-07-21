<template lang="pug">
main
  h4.my-5.text-center {{ $t('total_categories_count', [labels.length]) }}
  ul.list-unstyled
    router-link.d-inline-flex.mx-2.my-2(v-for="{color, id, name} of labels"
                                        tag="li"
                                        :key="id"
                                        :to="{ path: '/', query: { labels: name } }"
                                        :style="{ backgroundColor: '#' + color }")
      a.px-3.py-1.small(:style="{ color: $utils.invertColor(color) }") {{ name }}
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

import { Label } from 'types'
import { getDefaultLabels } from 'utils'

@Component({
  title: (vm: Categories) => vm.$t('categories'),
  translator: {
    en: {
      categories: 'Categories',
      total_categories_count: 'There are { 0 } categories totally now',
    },
    zh: {
      categories: '分类',
      total_categories_count: '目前共计 { 0 } 个分类',
    },
  },
})
export default class Categories extends Vue {
  get labels(): Label[] {
    return getDefaultLabels({
      apollo: this.$apollo,
      store: this.$store,
    })
  }
}
</script>
