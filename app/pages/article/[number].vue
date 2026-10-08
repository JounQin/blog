<script setup lang="ts">
import invertColor from 'invert-color'

import type { ArticlePayload } from '#shared/types/blog'

import { timeAgo } from '~/utils/format'

const route = useRoute()
const { t, tt, locale, toggleLocale, prefetch } = useI18n()

const { data: article, error } = await useAsyncData(
  `article-${route.params.number}`,
  async () => {
    const payload = await $fetch<ArticlePayload>(
      `/api/article/${route.params.number}`,
      { retry: 0 },
    )

    // only the title is prefetched during SSR: article bodies easily exceed the
    // translation provider's per-request limit and are filled in on the client
    await prefetch([payload.title])

    return payload
  },
)

useHead(() => ({
  title: article.value ? tt(article.value.title) : t('home'),
}))
</script>

<template>
  <main v-if="article">
    <h4>
      <a
        class="heading-link"
        :href="article.url"
        >{{ tt(article.title) }}</a
      >
    </h4>
    <small class="text-secondary">
      {{ timeAgo(article.createdAt, locale) }}
    </small>
    <ul class="list-unstyled d-inline-flex mb-0">
      <li
        v-for="label of article.labels.nodes"
        :key="label.id"
        class="d-inline-flex ms-2 px-2"
        :style="{ backgroundColor: `#${label.color}` }"
      >
        <NuxtLink
          class="small"
          :style="{ color: invertColor(`#${label.color}`) }"
          :to="{ path: '/', query: { labels: label.name } }"
        >
          {{ label.name }}
        </NuxtLink>
      </li>
    </ul>
    <small
      class="pull-right text-primary clickable"
      @click="toggleLocale"
    >
      {{ t('toggle_locale') }}
    </small>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div
      class="markdown-body comment-body my-3 my-md-5"
      v-html="tt(article.bodyHTML, false)"
    />
    <ul class="list-unstyled">
      <li
        v-for="comment of article.comments.nodes"
        :key="comment.url"
        class="media my-4"
      >
        <a
          v-if="comment.author"
          class="d-none d-md-block"
          :href="comment.author.url"
        >
          <img
            class="rounded me-3 avatar-img"
            :src="`${comment.author.avatarUrl}&s=50`"
            :srcset="`${comment.author.avatarUrl}&s=100 2x`"
            alt="avatar"
          >
        </a>
        <div class="media-body">
          <div class="card">
            <div class="card-header d-flex align-items-center">
              <a
                v-if="comment.author"
                class="d-md-none"
                :href="comment.author.url"
              >
                <img
                  class="rounded me-3 avatar-img"
                  :src="`${comment.author.avatarUrl}&s=32`"
                  :srcset="`${comment.author.avatarUrl}&s=64 2x`"
                  alt="avatar"
                >
              </a>
              <div class="d-inline-block">
                <a
                  v-if="comment.author"
                  class="text-body"
                  :href="comment.author.url"
                >
                  {{ comment.author.login }}
                </a>
                <a
                  class="small text-secondary d-block d-md-inline-block ms-0 ms-md-2"
                  :href="comment.url"
                >
                  {{ timeAgo(comment.createdAt, locale) }}
                </a>
              </div>
            </div>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div
              class="card-body markdown-body comment-body"
              v-html="comment.bodyHTML"
            />
          </div>
        </div>
      </li>
    </ul>
    <div class="d-flex justify-content-center">
      <a :href="`${article.url}#new_comment_field`">{{ t('add_comment') }}</a>
    </div>
  </main>
  <main
    v-else-if="error"
    class="py-5 text-center text-muted"
  >
    Could not load this article ({{ error.statusCode }}
    {{ error.statusMessage }})
  </main>
</template>
