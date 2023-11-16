<template lang="pug">
div(:class='$style.progress', :style='{ width: progress + "%" }')
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class HiProgress extends Vue {
  @Prop({
    required: true,
    type: Number,
  })
  progress: number
}
</script>
<style lang="scss" module>
$progress-color: #39b983 !default;

.progress {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10001;
  background-color: $progress-color;
  height: 2px;
  opacity: 0.8;
  // stylelint-disable-next-line plugin/no-low-performance-animation-properties
  transition: width 0.5s;
}
</style>
