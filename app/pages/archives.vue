<script setup lang="ts">
import type { BlogIssue } from '#shared/types/blog'

import { dateFormat } from '~/utils/format'

const { t, tt, prefetch } = useI18n()

const { data, error } = await useAsyncData('archives', async () => {
  const payload = await $fetch<{ nodes: BlogIssue[] }>('/api/archives', {
    retry: 0,
  })

  await prefetch(payload.nodes.map(issue => issue.title))

  return payload
})

const archives = computed(() => data.value?.nodes ?? [])

const archivesMap = computed(() => {
  const grouped: Record<number, BlogIssue[]> = {}

  for (const archive of archives.value) {
    const year = new Date(archive.createdAt).getFullYear()
    grouped[year] = grouped[year] || []
    grouped[year].push(archive)
  }

  return Object.keys(grouped)
    .map(Number)
    .reverse()
    .map(year => ({ year, archives: grouped[year] }))
})

useHead(() => ({ title: t('archives') }))
</script>

<template>
  <main>
    <div class="my-2 my-md-5 archives-main">
      <h6 class="archives-item archives-title">
        {{ t('total_archives_count', [archives.length]) }}
      </h6>
      <p
        v-if="error"
        class="muted"
      >
        Could not load archives ({{ error.statusCode }}
        {{ error.statusMessage }})
      </p>
      <ol
        v-else
        class="list-unstyled"
      >
        <li
          v-for="group of archivesMap"
          :key="group.year"
        >
          <h5 class="mt-5 my-3 archives-item">{{ group.year }}</h5>
          <ol class="list-unstyled">
            <li
              v-for="issue of group.archives"
              :key="issue.id"
              class="py-4 archives-item archives-article"
            >
              <small class="text-muted mr-2">
                {{ dateFormat(issue.createdAt, 'MM-dd') }}
              </small>
              <NuxtLink :to="`/article/${issue.number}`">
                {{ tt(issue.title) }}
              </NuxtLink>
            </li>
          </ol>
        </li>
      </ol>
    </div>
  </main>
</template>

<style lang="scss" scoped>
.archives-main {
  position: relative;
  margin-left: 15px;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -4px;
    width: 4px;
    background-color: #f5f5f5;
  }
}

.archives-item {
  position: relative;
  padding-left: 20px;

  &:before {
    position: absolute;
    content: '';
    width: 8px;
    height: 8px;
    background-color: #bbb;
    border-radius: 50%;
    top: 50%;
    left: -2px;
    transform: translate3d(-50%, -50%, 0);
  }

  &.archives-title:before {
    width: 10px;
    height: 10px;
    background-color: #555;
    opacity: 0.5;
  }

  &.archives-article {
    border-bottom: 1px dashed #ccc;

    &:hover {
      border-bottom-color: #666;

      &:before {
        background-color: #222;
      }
    }
  }
}
</style>
