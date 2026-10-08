<script setup lang="ts">
defineProps<{
  size?: number
}>()
</script>

<template>
  <div
    class="d-inline-block hi-loading"
    :style="size ? { width: `${size}px`, height: `${size}px` } : undefined"
  />
</template>

<style lang="scss" scoped>
.hi-loading {
  animation: loading 0.5s infinite linear;
  border: 2px solid #ccc;
  border: {
    right-color: transparent;
    radius: 50%;
  }

  width: 15px;
  height: 15px;

  // the light `#ccc` ring disappears on the dark canvas
  @include color-mode(dark) {
    border-color: var(--fgColor-muted);
    // re-assert the gap the shorthand above punched into the ring
    border-right-color: transparent;
  }
}

@keyframes loading {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(1turn);
  }
}
</style>
