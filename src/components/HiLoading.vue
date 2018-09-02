<template lang="pug">
.d-inline-block(:class="$style.loading", :style="size && { width: size + 'px', height: size + 'px' }")
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class HiLoading extends Vue {
  @Prop(Number)
  size: number
}
</script>
<style lang="scss" module>
.loading {
  animation: loading 0.5s infinite linear;
  border: 2px solid rgb(204, 204, 204);
  border-right-color: transparent;
  border-radius: 50%;
  width: 15px;
  height: 15px;
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
