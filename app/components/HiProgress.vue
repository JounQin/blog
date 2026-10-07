<script setup lang="ts">
defineProps<{
  progress: number
}>()
</script>

<template>
  <div class="hi-progress" :style="{ width: `${progress}%` }" />
</template>

<style lang="scss" scoped>
$progress-color: #39b983 !default;

.hi-progress {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10001;
  background-color: $progress-color;
  height: 2px;
  opacity: 0.8;
  transition: width 0.5s;
}
</style>
