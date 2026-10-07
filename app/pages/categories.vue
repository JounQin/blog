<script setup lang="ts">
import invertColor from 'invert-color'

import type { LabelsPayload } from '#shared/types/blog'

const { t } = useI18n()

const { data, error } = await useAsyncData('categories', () =>
  $fetch<LabelsPayload>('/api/categories'),
)

const labels = computed(() => data.value?.nodes ?? [])

useHead(() => ({ title: t('categories') }))
</script>

<template>
  <main>
    <h4 class="my-5 text-center">
      {{ t('total_categories_count', [labels.length]) }}
    </h4>
    <p v-if="error" class="muted">
      Could not load categories ({{ error.statusCode }}
      {{ error.statusMessage }})
    </p>
    <ul v-else class="list-unstyled">
      <li
        v-for="label of labels"
        :key="label.id"
        class="d-inline-flex mx-2 my-2"
        :style="{ backgroundColor: `#${label.color}` }"
      >
        <NuxtLink
          class="px-3 py-1 small"
          :style="{ color: invertColor(`#${label.color}`) }"
          :to="{ path: '/', query: { labels: label.name } }"
        >
          {{ label.name }}
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>
