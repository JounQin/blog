<script setup lang="ts">
import type { OwnerProfile } from '#shared/types/blog'

const { t } = useI18n()

const { data: owner, error } = await useAsyncData('about', () =>
  $fetch<OwnerProfile>('/api/about', { retry: 0 }),
)

const login = computed(
  () => owner.value?.resourcePath?.split('/').pop() ?? '',
)

const pinnedItems = computed(() =>
  (owner.value?.pinnedItems?.nodes ?? []).filter(Boolean),
)

useHead(() => ({ title: t('about') }))
</script>

<template>
  <main v-if="owner">
    <blockquote
      class="d-flex align-items-center justify-content-center text-secondary quote about-profile"
    >
      <a :href="owner.url">
        <img
          class="mr-2 about-avatar"
          :src="`${owner.avatarUrl}&s=40`"
          :srcset="`${owner.avatarUrl}&s=80 2x`"
          alt="avatar"
        >
      </a>
      <div class="text-left">
        <a :href="owner.url">{{ owner.name }}</a>
        <template v-if="owner.email"> ({{ owner.email }})</template>
        <template v-if="owner.bio || owner.description">
          :<br >
          {{ owner.bio || owner.description }}
        </template>
      </div>
    </blockquote>
    <div class="d-flex mb-2">
      <div class="flex-1">
        <i class="fa fa-location-arrow mr-2" />{{ owner.location }}
      </div>
      <div class="flex-1 text-right">
        <i class="fa fa-link mr-2" />
        <a :href="owner.websiteUrl || owner.url">
          {{ owner.websiteUrl || owner.url }}
        </a>
      </div>
    </div>
    <ul class="list-unstyled about-repositories">
      <li
        v-for="repository of pinnedItems"
        :key="repository.id"
        class="mt-3 mt-md-4"
      >
        <div class="card flex-1">
          <div class="card-body">
            <h5 class="card-title">
              <a :href="repository.url">
                <span class="mr-2">
                  {{ repository.nameWithOwner.replace(`${login}/`, '') }}
                </span>
                <small>
                  <i class="fa fa-star mr-1" />
                  {{ repository.stargazers.totalCount }}
                </small>
              </a>
            </h5>
            <div class="card-text">
              <span class="text-secondary">{{ repository.description }}</span>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </main>
  <main v-else-if="error" class="py-5 text-center text-muted">
    Could not load profile ({{ error.statusCode }} {{ error.statusMessage }})
  </main>
</template>

<style lang="scss" scoped>
.about-avatar {
  width: 40px;
  height: 40px;
}

.about-repositories {
  display: flex;
  flex-wrap: wrap;
  margin: {
    right: -20px;
    bottom: 0;
  }

  > li {
    display: flex;
    width: 50%;

    :deep(.card) {
      margin-right: 20px;
    }
  }

  @media (max-width: $grid-breakpoints-md) {
    margin-right: 0;

    > li {
      width: 100%;

      :deep(.card) {
        margin-right: 0;
      }
    }
  }
}
</style>
