<template lang="pug">
div(:class="$style.progress" :style="{width: progress + '%'}")
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class HiProgress extends Vue {
  @Prop({ required: true })
  progress: number
}
</script>
<style lang="scss" module>
$progress-color: #39b983;

.progress {
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
