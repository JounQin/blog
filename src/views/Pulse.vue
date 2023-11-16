<template lang="pug">
main
  .row
    .col-md
      .text-center
        .btn-group
          button.btn.btn-light(
            v-for='type of types',
            :class='{ active: type === activeType }',
            @click='activeType = type'
          ) {{ type }}
      ol.list-unstyled(:class='$style.list')
        li.d-flex.align-items-center.my-4(
          v-for='{ closedAt, createdAt, isPr, mergedAt, repository, state, title, url } of pulses'
        )
          .px-3
            i.fa(
              :class='[isPr ? "fa-code-fork" : "fa-bug", state.toLowerCase()]'
            )
          div
            h5.font-weight-bold
              a.heading-link(:href='url') {{ title }}
              small.text-muted.ml-2 {{ $t('created_at') }}: {{ createdAt | dateFormat }}
              small.text-muted.ml-2(v-if='mergedAt') {{ $t('merged_at') }}: {{ mergedAt | dateFormat }}
              small.text-muted.ml-2(v-if='closedAt') {{ $t('closed_at') }}: {{ closedAt | dateFormat }}
            a(:href='repository.url') {{ repository.nameWithOwner }}
      .text-center(v-if='prPageInfo.hasNextPage || iPageInfo.hasNextPage')
        .d-inline-flex.align-items-center
          .text-muted.clickable(@click='fetchMore') {{ $t('load_more') }}
          hi-loading.ml-2(v-if='loading')
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Store } from 'vuex'

import HiLoading from 'components/HiLoading.vue'
import queries from 'queries.gql'
import { Issue, PageInfo, PullRequest, RootState, User } from 'types'

enum Type {
  ALL = 'All',
  PRS = 'PRs',
  ISSUES = 'Issues',
}

@Component({
  asyncData: ({
    apollo,
    store: {
      getters: { LOGIN },
    },
  }) =>
    Promise.all([
      apollo.query({
        query: queries.pullRequests,
        variables: LOGIN,
      }),
      apollo.query({
        query: queries.issues,
        variables: LOGIN,
      }),
    ]),
  title: (vm: Pulse) => vm.$t('pulse'),
  translator: {
    zh: {
      created_at: '创建于',
      merged_at: '合并于',
      closed_at: '关闭于',
      load_more: '加载更多',
    },
    en: {
      created_at: 'Created At',
      merged_at: 'Merged At',
      closed_at: 'Closed At',
      load_more: 'Load More',
    },
  },
  components: {
    HiLoading,
  },
})
export default class Pulse extends Vue {
  types = [Type.ALL, Type.PRS, Type.ISSUES]
  activeType = Type.ALL

  pullRequests: PullRequest[] = null
  prPageInfo: PageInfo = null

  issues: Issue[] = null
  iPageInfo: PageInfo = null

  loading = false

  get pulses() {
    switch (this.activeType) {
      case Type.ALL: {
        return [...this.pullRequests, ...this.issues].sort((x, y) =>
          x.createdAt > y.createdAt ? -1 : 1,
        )
      }
      case Type.PRS: {
        return this.pullRequests
      }
      case Type.ISSUES: {
        return this.issues
      }
      default: {
        return null
      }
    }
  }

  created() {
    this.setData(this.$store)
  }

  setData(
    store: Store<RootState>,
    {
      prAfter,
      prNext,
      iAfter,
      iNext,
    }: {
      prAfter?: string
      prNext?: boolean
      iAfter?: string
      iNext?: boolean
    } = {},
  ) {
    const { LOGIN } = store.getters
    const excludedOwners = store.state.envs.GITHUB_EXCLUDED_REPOSITORY_OWNERS

    if (prNext !== false) {
      const { pullRequests: prs } = this.$apollo.readQuery<{ user: User }>({
        query: queries.pullRequests,
        variables: {
          ...LOGIN,
          after: prAfter,
        },
      }).user

      const pullRequests = prs.nodes.filter(pr => {
        Object.assign(pr, { isPr: true })
        return !excludedOwners.includes(pr.repository.owner.login)
      })

      if (this.pullRequests) {
        this.pullRequests.push(...pullRequests)
      } else {
        this.pullRequests = pullRequests
      }

      this.prPageInfo = prs.pageInfo
    }

    if (iNext !== false) {
      const { issues: is } = this.$apollo.readQuery<{ user: User }>({
        query: queries.issues,
        variables: {
          ...LOGIN,
          after: iAfter,
        },
      }).user

      const issues = is.nodes.filter(
        issue => !excludedOwners.includes(issue.repository.owner.login),
      )

      if (this.issues) {
        this.issues.push(...issues)
      } else {
        this.issues = issues
      }

      this.iPageInfo = is.pageInfo
    }
  }

  async fetchMore() {
    const { endCursor: prAfter, hasNextPage: prNext } = this.prPageInfo
    const { endCursor: iAfter, hasNextPage: iNext } = this.iPageInfo

    const promises: Array<Promise<unknown>> = []

    if (prNext) {
      promises.push(
        this.$apollo.query({
          query: queries.pullRequests,
          variables: {
            ...this.$store.getters.LOGIN,
            after: prAfter,
          },
        }),
      )
    }

    if (iNext) {
      promises.push(
        this.$apollo.query({
          query: queries.issues,
          variables: {
            ...this.$store.getters.LOGIN,
            after: iAfter,
          },
        }),
      )
    }

    this.loading = true

    await Promise.all(promises)

    this.setData(this.$store, {
      prAfter,
      prNext,
      iAfter,
      iNext,
    })

    this.loading = false
  }
}
</script>
<style lang="scss" module>
// stylelint-disable-next-line scss/selector-nest-combinators
.list > li :global {
  h5 {
    small {
      font-size: 12px;
    }
  }

  .fa {
    font-size: 20px;

    &.open {
      color: #28a745;
    }

    &.merged {
      color: #6f42c1;
    }

    &.closed {
      color: #cb2431;
    }
  }
}
</style>
