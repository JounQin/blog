<script setup lang="ts">
import type {
  PulseIssue,
  PulsePayload,
  PullRequestItem,
} from '#shared/types/blog'

import { dateFormat } from '~/utils/format'

const Type = {
  ALL: 'All',
  PRS: 'PRs',
  ISSUES: 'Issues',
} as const

type PulseType = (typeof Type)[keyof typeof Type]

interface PulseResponse {
  pullRequests: PulsePayload<PullRequestItem>
  issues: PulsePayload<PulseIssue>
}

const types = [Type.ALL, Type.PRS, Type.ISSUES]
const activeType = ref<PulseType>(Type.ALL)
const loading = ref(false)

const { t } = useI18n()

const { data, error } = await useAsyncData('pulse', () =>
  $fetch<PulseResponse>('/api/pulse', { retry: 0 }),
)

const pullRequests = ref<PullRequestItem[]>(data.value?.pullRequests.nodes ?? [])
const issues = ref<PulseIssue[]>(data.value?.issues.nodes ?? [])
const prPageInfo = ref(data.value?.pullRequests.pageInfo)
const iPageInfo = ref(data.value?.issues.pageInfo)

const pulses = computed(() => {
  switch (activeType.value) {
    case Type.PRS: {
      return pullRequests.value
    }
    case Type.ISSUES: {
      return issues.value
    }
    default: {
      return [...pullRequests.value, ...issues.value].sort((x, y) =>
        x.createdAt > y.createdAt ? -1 : 1,
      )
    }
  }
})

const loadMore = async () => {
  const prNext = prPageInfo.value?.hasNextPage
  const iNext = iPageInfo.value?.hasNextPage

  if (!prNext && !iNext) {
    return
  }

  loading.value = true

  try {
    const result = await $fetch<PulseResponse>('/api/pulse', {
      retry: 0,
      query: {
        prAfter: prNext ? prPageInfo.value?.endCursor : undefined,
        iAfter: iNext ? iPageInfo.value?.endCursor : undefined,
      },
    })

    if (prNext) {
      pullRequests.value = [...pullRequests.value, ...result.pullRequests.nodes]
      prPageInfo.value = result.pullRequests.pageInfo
    }

    if (iNext) {
      issues.value = [...issues.value, ...result.issues.nodes]
      iPageInfo.value = result.issues.pageInfo
    }
  } finally {
    loading.value = false
  }
}

useHead(() => ({ title: t('pulse') }))
</script>

<template>
  <main>
    <div class="row">
      <div class="col-md">
        <div class="text-center">
          <div class="btn-group">
            <button
              v-for="type of types"
              :key="type"
              class="btn btn-light"
              :class="{ active: type === activeType }"
              @click="activeType = type"
            >
              {{ type }}
            </button>
          </div>
        </div>
        <ol class="list-unstyled pulse-list">
          <li
            v-for="item of pulses"
            :key="item.id"
            class="d-flex align-items-center my-4"
          >
            <div class="px-3">
              <i
                class="fa"
                :class="[
                  (item as PullRequestItem).isPr ? 'fa-code-fork' : 'fa-bug',
                  item.state.toLowerCase(),
                ]"
              />
            </div>
            <div>
              <h5 class="font-weight-bold">
                <a class="heading-link" :href="item.url">{{ item.title }}</a>
                <small class="text-muted ml-2">
                  {{ t('created_at') }}: {{ dateFormat(item.createdAt) }}
                </small>
                <small
                  v-if="(item as PullRequestItem).mergedAt"
                  class="text-muted ml-2"
                >
                  {{ t('merged_at') }}:
                  {{ dateFormat((item as PullRequestItem).mergedAt as string) }}
                </small>
                <small
                  v-if="(item as PulseIssue).closedAt"
                  class="text-muted ml-2"
                >
                  {{ t('closed_at') }}:
                  {{ dateFormat((item as PulseIssue).closedAt as string) }}
                </small>
              </h5>
              <a :href="item.repository.url">{{ item.repository.nameWithOwner }}</a>
            </div>
          </li>
        </ol>
        <p v-if="error" class="muted text-center">
          Could not load pulse ({{ error.statusCode }} {{ error.statusMessage }})
        </p>
        <div
          v-if="prPageInfo?.hasNextPage || iPageInfo?.hasNextPage"
          class="text-center"
        >
          <div class="d-inline-flex align-items-center">
            <span class="text-muted clickable" @click="loadMore">
              {{ t('load_more') }}
            </span>
            <HiLoading v-if="loading" class="ml-2" />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
.pulse-list > li {
  :deep(h5 small) {
    font-size: 12px;
  }

  :deep(.fa) {
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
