<script setup lang="ts">
import invertColor from 'invert-color'

import type { IssuesPayload } from '#shared/types/blog'

import { dateFormat } from '~/utils/format'

const route = useRoute()
const { t, tt, prefetch } = useI18n()

const asString = (value: unknown) =>
  Array.isArray(value) ? value[0] : (value as string | undefined)

const { data, error } = await useAsyncData(
  'articles',
  async () => {
    const payload = await $fetch<IssuesPayload>('/api/articles', {
      retry: 0,
      query: {
        after: asString(route.query.after),
        before: asString(route.query.before),
        labels: asString(route.query.labels),
        search: asString(route.query.search),
      },
    })

    await prefetch(payload.nodes.map(issue => issue.title))

    return payload
  },
  { watch: [() => route.query] },
)

const articles = computed(() => data.value?.nodes ?? [])
const pageInfo = computed(() => data.value?.pageInfo)

const prevRoute = computed(() => ({
  path: '/',
  query: {
    before: pageInfo.value?.startCursor,
    search: asString(route.query.search),
  },
}))

const nextRoute = computed(() => ({
  path: '/',
  query: {
    after: pageInfo.value?.endCursor,
    search: asString(route.query.search),
  },
}))

const emptyTip = computed(() =>
  t('no_content', [
    route.query.labels
      ? t('in_categories')
      : route.query.search == null
        ? ''
        : t('in_search'),
  ]),
)

useHead(() => ({ title: t('home') }))
</script>

<template>
  <main v-if="articles.length" class="home-main">
    <ul class="list-unstyled">
      <li
        v-for="issue of articles"
        :key="issue.id"
        class="border-b my-4"
      >
        <h5>
          <NuxtLink class="heading-link" :to="`/article/${issue.number}`">
            {{ tt(issue.title) }}
          </NuxtLink>
        </h5>
        <small class="d-inline-flex text-muted">
          {{ dateFormat(issue.createdAt) }}
        </small>
        <ul class="list-unstyled d-inline-flex">
          <li
            v-for="label of issue.labels.nodes"
            :key="label.id"
            class="d-inline-flex ml-2"
            :style="{ backgroundColor: `#${label.color}` }"
          >
            <NuxtLink
              class="px-2 small"
              :style="{ color: invertColor(`#${label.color}`) }"
              :to="{ path: '/', query: { labels: label.name } }"
            >
              {{ label.name }}
            </NuxtLink>
          </li>
        </ul>
      </li>
    </ul>
    <nav v-if="pageInfo?.hasPreviousPage || pageInfo?.hasNextPage">
      <ul class="pagination justify-content-end">
        <li class="page-item" :class="{ disabled: !pageInfo?.hasPreviousPage }">
          <NuxtLink class="page-link" :to="prevRoute">
            {{ t('previous_page') }}
          </NuxtLink>
        </li>
        <li class="page-item" :class="{ disabled: !pageInfo?.hasNextPage }">
          <NuxtLink class="page-link" :to="nextRoute">
            {{ t('next_page') }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </main>
  <main v-else class="py-5 text-center text-muted">
    <p v-if="error" class="muted">
      Could not load articles ({{ error.statusCode }} {{ error.statusMessage }})
    </p>
    <template v-else>{{ emptyTip }}</template>
  </main>
</template>

<style lang="scss" scoped>
@media (max-width: $grid-breakpoints-md) {
  .home-main {
    padding: {
      top: 7px !important;
      bottom: 7px !important;
    }
  }
}
</style>
