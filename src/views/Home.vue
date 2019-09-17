<template lang="pug">
main(v-if="articles.length", :class="$style.main")
  ul.list-unstyled
    li.border-b.my-4(v-for="{ createdAt, id, number, title, labels: { nodes: labels } } of articles", :key="id")
      h5
        router-link.heading-link(:to="`/article/${number}`") {{ $tt(title) }}
      small.d-inline-flex.text-muted {{ createdAt | dateFormat }}
      ul.list-unstyled.d-inline-flex
        router-link.d-inline-flex.ml-2(v-for="{ id, color, name } of labels"
                                       tag="li"
                                       :key="id"
                                       :to="{ path: '/', query: { labels: name } }"
                                       :style="{ backgroundColor: '#' + color }")
          a.px-2.small(:style="{ color: $utils.invertColor(color) }") {{ name }}
  nav(v-if="pageInfo.hasPreviousPage || pageInfo.hasNextPage")
    ul.pagination.justify-content-end
      router-link.page-item(:to="prevRoute", :class="{ disabled: !pageInfo.hasPreviousPage }", tag="li")
        a.page-link {{ $t('previous_page') }}
      router-link.page-item(:to="nextRoute", :class="{ disabled: !pageInfo.hasNextPage }", tag="li")
        a.page-link {{ $t('next_page') }}
main.py-5.text-center.text-muted(v-else) {{ $t('no_content', [$route.query.labels ? $t('in_categories') : $route.query.search == null ? '' : $t('in_search')]) }}
</template>
<script lang="ts">
import { QueryOptions } from 'apollo-client'
import { Component, Vue } from 'vue-property-decorator'
import { Route } from 'vue-router'

import {
  AsyncDataFn,
  Issue,
  PageInfo,
  Repository,
  SearchResultItemConnection,
} from 'types'
import { getDefaultLabels } from 'utils'
import querires from 'queries.gql'

interface Articles {
  nodes: Issue[]
  pageInfo: PageInfo
}

const getQueryOptions: AsyncDataFn<QueryOptions> = ({
  apollo,
  route,
  store,
}) => {
  const {
    before,
    after,
    labels = getDefaultLabels({ apollo, store }).map(({ name }) => name),
    search,
  } = route.query

  const { REPOSITORY } = store.getters

  const searchText = search && (search as string).trim()

  const variables = {
    ...REPOSITORY,
    first: (!(before || after) || after) && 25,
    last: before && 25,
    before,
    after,
    labels,
    search:
      searchText &&
      `repo:${REPOSITORY.owner}/${REPOSITORY.name} is:issue is:open ${searchText}`,
  }

  return {
    query: search ? querires.search : querires.articles,
    variables,
  }
}

@Component({
  async asyncData({ apollo, route, store, translate }) {
    const { data } = await apollo.query<
      | {
          search: SearchResultItemConnection
        }
      | {
          repository: Repository
        }
    >(getQueryOptions({ apollo, route, store }))

    let articles: Articles

    if ('search' in data) {
      articles = data.search as Articles
    } else {
      articles = data.repository.issues as Articles
    }

    articles.nodes.forEach(({ title }) => translate(title))
  },
  title: (vm: Home) => vm.$t('home'),
  translator: {
    en: {
      home: 'Home',
      no_content: 'No content{ 0 }',
      in_categories: ' in current categories',
      in_search: ' under current search conditions',
      previous_page: 'Previous',
      next_page: 'Next',
    },
    zh: {
      home: '首页',
      no_content: '当前{ 0 }暂无内容',
      in_categories: '分类下',
      in_search: '搜索条件下',
      previous_page: '上一页',
      next_page: '下一页',
    },
  },
})
export default class Home extends Vue {
  articles: Issue[] = null
  pageInfo: PageInfo = null

  setData() {
    const data = this.$apollo.readQuery<
      {
        search: SearchResultItemConnection
      } & {
        repository: Repository
      }
    >(
      getQueryOptions({
        apollo: this.$apollo,
        route: this.$route,
        store: this.$store,
      }),
    )

    let articles: Articles

    if (data.search) {
      articles = data.search as Articles
    } else {
      articles = data.repository.issues as Articles
    }

    this.articles = articles.nodes
    this.pageInfo = articles.pageInfo
  }

  created() {
    this.setData()
  }

  async beforeRouteUpdate(to: Route, _from: Route, next: () => void) {
    await this.$apollo.query(
      getQueryOptions({
        apollo: this.$apollo,
        route: to,
        store: this.$store,
      }),
    )
    next()
    this.setData()
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
@media (max-width: $grid-breakpoints-md) {
  .main {
    padding: {
      top: 7px !important;
      bottom: 7px !important;
    }
  }
}
</style>
