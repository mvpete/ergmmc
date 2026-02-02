<template>
  <div class="circular-progress" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <circle
        class="progress-bg"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        fill="none"
      />
      <circle
        class="progress-bar"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        fill="none"
        :stroke="color"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
      />
    </svg>
    <div class="progress-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  percentage: {
    type: Number,
    default: 0
  },
  size: {
    type: Number,
    default: 300
  },
  strokeWidth: {
    type: Number,
    default: 20
  },
  color: {
    type: String,
    default: '#4ade80'
  }
})

const center = computed(() => props.size / 2)
const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => {
  const clampedPercentage = Math.min(100, Math.max(0, props.percentage))
  return circumference.value * (1 - clampedPercentage / 100)
})
</script>

<style scoped>
.circular-progress {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circular-progress svg {
  transform: rotate(-90deg);
  position: absolute;
}

.progress-bg {
  stroke: #374151;
}

.progress-bar {
  transition: stroke-dashoffset 0.5s ease-in-out;
}

.progress-content {
  z-index: 1;
  text-align: center;
}
</style>
