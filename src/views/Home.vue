<template lang="pug">
main(v-if="issues.length", :class="$style.main")
  ul.list-unstyled
    li.border-b.my-4(v-for="{ createdAt, id, number, title, labels: { nodes: labels } } of issues", :key="id")
      h5
        router-link.heading-link(:to="`/article/${number}`") {{ title }}
      small.d-inline-flex.text-muted {{ createdAt | dateFormat }}
      ul.list-unstyled.d-inline-flex
        router-link.d-inline-flex.ml-2(v-for="{ id, color, name } of labels"
                                       tag="li"
                                       :key="id"
                                       :to="{ path: '/', query: { labels: name } }"
                                       :style="{ backgroundColor: color }")
          a.px-2.small(:style="{ color: invertColor(color) }") {{ name }}
  nav
    ul.pagination.justify-content-end
      router-link.page-item(:to="prevRoute", :class="{ disabled: !pageInfo.hasPreviousPage }", tag="li")
        a.page-link Previous
      router-link.page-item(:to="nextRoute", :class="{ disabled: !pageInfo.hasNextPage }", tag="li")
        a.page-link Next
main.py-5.text-center.text-muted(v-else) {{ $t('no_content', [$route.query.labels ? $t('in_categories') : $route.query.search == null ? '' : $t('in_search')]) }}
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Route } from 'vue-router'
import { Store } from 'vuex'
import { State } from 'vuex-class'

import {
  Issue,
  PageInfo,
  Repository,
  RootState,
  SearchResultItemConnection,
} from 'types'
import { REPOSITORY, invertColor } from 'utils'

import * as querires from 'queries.gql'

interface Issues {
  nodes: Issue[]
  pageInfo: PageInfo
}

const { apollo } = Vue

const fetch = async (to: Route, store: Store<RootState>) => {
  const { before, after, labels, search } = to.query

  const searchText = search && search.trim()

  const variables = {
    ...REPOSITORY,
    first: (!(before || after) || after) && 25,
    last: before && 25,
    before,
    after,
    labels,
    search:
      searchText &&
      `repo:${REPOSITORY.owner}/${
        REPOSITORY.name
      } is:issue is:open ${searchText}`,
  }

  let issues: Issues

  if (search) {
    const { data } = await apollo.query<{
      search: SearchResultItemConnection
    }>({
      query: querires.search,
      variables,
    })

    issues = data.search as Issues
  } else {
    const { data: { repository } } = await apollo.query<{
      repository: Repository
    }>({
      query: querires.issues,
      variables,
    })

    issues = repository.issues as Issues
  }

  store.commit('SET_ISSUES', issues.nodes)
  store.commit('SET_PAGE_INFO', issues.pageInfo)
}

@Component({
  asyncData: ({ route, store }) => fetch(route, store),
  translator: {
    en: {
      no_content: 'No content{ 0 }',
      in_categories: ' in current categories',
      in_search: ' under current search conditions',
    },
    zh: {
      no_content: '当前{ 0 }暂无内容',
      in_categories: '分类下',
      in_search: '搜索条件下',
    },
  },
})
export default class Home extends Vue {
  @State('issues') issues: Issue[]
  @State('pageInfo') pageInfo: PageInfo

  invertColor = invertColor

  async beforeRouteUpdate(to: Route, from: Route, next: () => void) {
    await fetch(to, this.$store)
    next()
  }

  get prevRoute() {
    return {
      path: '/',
      query: {
        before: this.pageInfo.startCursor,
        search: this.$route.query.search,
      },
    }
  }

  get nextRoute() {
    return {
      path: '/',
      query: {
        after: this.pageInfo.endCursor,
        search: this.$route.query.search,
      },
    }
  }
}
</script>
<style lang="scss" module>
@media (max-width: 768px) {
  .main {
    padding-top: 0.5rem !important;
    padding-bottom: 0.5rem !important;
  }
}
</style>
