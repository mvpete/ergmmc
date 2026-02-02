<template>
  <div class="progress-view">
    <template v-if="loading">
      <div class="loading-state">
        <div class="spinner"></div>
        <span>Loading your progress...</span>
      </div>
    </template>

    <template v-else-if="error">
      <div class="error">{{ error }}</div>
      <button class="connect-btn" style="margin-top: 1rem" @click="$emit('retry')">
        Retry
      </button>
    </template>

    <template v-else>
      <div class="lifetime-section">
        <div class="lifetime-label">Lifetime Meters</div>
        <div class="lifetime-value">{{ formattedLifetime }}</div>
      </div>

      <div class="year-section">
        <h2 class="year-title">{{ dateRangeLabel }}</h2>
        <CircularProgress
          :percentage="percentage"
          :size="280"
          :stroke-width="20"
          :color="onTrack ? '#4ade80' : '#f87171'"
        >
          <div class="meters">{{ formattedMeters }}</div>
          <div class="meters-label">meters</div>
          <div class="goal">of {{ formattedGoal }}</div>
          <div class="status" :class="{ 'on-track': onTrack, 'behind': !onTrack }">
            {{ onTrack ? 'On Track' : 'Behind' }}
          </div>
          <div class="expected">Expected: {{ formattedExpected }}</div>
        </CircularProgress>
      </div>

      <div class="badges-section">
        <div class="badges-label">Million Meter Club</div>
        <div class="badges-grid">
          <div
            v-for="badge in badges"
            :key="badge.value"
            class="badge"
            :class="{ achieved: badge.achieved, next: badge.isNext }"
            :style="badge.isNext ? { '--progress': `${badge.progress}%` } : {}"
            :title="badge.isNext ? `${badge.label} - ${Math.round(badge.progress)}% complete` : `${badge.label} meters`"
          >
            <span class="badge-number">{{ badge.label }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CircularProgress from '../components/CircularProgress.vue'

const props = defineProps({
  totalMeters: { type: Number, default: 0 },
  lifetimeMeters: { type: Number, default: 0 },
  goal: { type: Number, default: 1_000_000 },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null }
})

defineEmits(['retry'])

const BADGE_MILESTONES = [1, 2, 3, 4, 5, 10, 15, 20]

const badges = computed(() => {
  let foundNext = false
  return BADGE_MILESTONES.map((m, index) => {
    const value = m * 1_000_000
    const achieved = props.lifetimeMeters >= value
    const prevValue = index > 0 ? BADGE_MILESTONES[index - 1] * 1_000_000 : 0

    // Calculate progress for the next unachieved badge
    let progress = 0
    let isNext = false
    if (!achieved && !foundNext) {
      foundNext = true
      isNext = true
      const metersIntoThisBadge = props.lifetimeMeters - prevValue
      const metersNeeded = value - prevValue
      progress = Math.min(100, Math.max(0, (metersIntoThisBadge / metersNeeded) * 100))
    }

    return { value, label: `${m}M`, achieved, isNext, progress }
  })
})

function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const dateRangeLabel = computed(() => {
  if (!props.startDate || !props.endDate) return 'Progress'
  const start = parseLocalDate(props.startDate)
  const end = parseLocalDate(props.endDate)
  const startYear = start.getFullYear()
  const endYear = end.getFullYear()

  // If same year and full year (Jan 1 - Dec 31), just show year
  if (startYear === endYear &&
      start.getMonth() === 0 && start.getDate() === 1 &&
      end.getMonth() === 11 && end.getDate() === 31) {
    return `${startYear} Progress`
  }

  // Otherwise show date range
  const opts = { month: 'short', day: 'numeric', year: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`
})

const percentage = computed(() => {
  return Math.min(100, (props.totalMeters / props.goal) * 100)
})

const expectedMeters = computed(() => {
  if (!props.startDate || !props.endDate) return 0

  const now = new Date()
  const start = parseLocalDate(props.startDate)
  const end = parseLocalDate(props.endDate)
  end.setHours(23, 59, 59, 999)

  if (now < start) return 0
  if (now > end) return props.goal

  const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1
  const daysPassed = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1
  return Math.round((daysPassed / totalDays) * props.goal)
})

const onTrack = computed(() => props.totalMeters >= expectedMeters.value)
const formattedMeters = computed(() => props.totalMeters.toLocaleString())
const formattedGoal = computed(() => props.goal.toLocaleString())
const formattedExpected = computed(() => expectedMeters.value.toLocaleString())
const formattedLifetime = computed(() => props.lifetimeMeters.toLocaleString())
</script>

<style scoped>
.progress-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 1rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: #9ca3af;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #374151;
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.lifetime-section {
  text-align: center;
}

.lifetime-label {
  font-size: 0.875rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

.lifetime-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #f9fafb;
}

.badges-section {
  text-align: center;
}

.badges-label {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-bottom: 0.75rem;
}

.badges-grid {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.badge {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1f2937;
  border: 2px solid #374151;
  transition: all 0.3s ease;
}

.badge.achieved {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: #34d399;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
}

.badge.next {
  background: conic-gradient(
    #10b981 0% var(--progress),
    #374151 var(--progress) 100%
  );
  border-color: #10b981;
  position: relative;
}

.badge.next::before {
  content: '';
  position: absolute;
  inset: 3px;
  background: #1f2937;
  border-radius: 50%;
}

.badge-number {
  font-size: 0.75rem;
  font-weight: 700;
  color: #6b7280;
  position: relative;
  z-index: 1;
}

.badge.next .badge-number {
  color: #10b981;
}

.badge.achieved .badge-number {
  color: #fff;
}

.year-section {
  text-align: center;
}

.year-title {
  font-size: 1rem;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 1rem;
}
</style>
