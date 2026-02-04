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
        <div class="lifetime-label">
          <svg class="erg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="24" height="24">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#357ABD;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect x="10" y="45" width="70" height="4" rx="2" fill="url(#grad1)"/>
            <rect x="35" y="40" width="12" height="8" rx="2" fill="#2C3E50"/>
            <line x1="48" y1="44" x2="75" y2="44" stroke="#E74C3C" stroke-width="3" stroke-linecap="round"/>
            <circle cx="77" cy="44" r="3" fill="#E74C3C"/>
            <circle cx="85" cy="44" r="12" fill="none" stroke="url(#grad1)" stroke-width="3"/>
            <circle cx="85" cy="44" r="8" fill="none" stroke="#4A90E2" stroke-width="2"/>
            <line x1="85" y1="36" x2="85" y2="52" stroke="#4A90E2" stroke-width="1.5"/>
            <line x1="77" y1="44" x2="93" y2="44" stroke="#4A90E2" stroke-width="1.5"/>
            <rect x="8" y="50" width="8" height="10" rx="1" fill="#2C3E50"/>
            <circle cx="41" cy="32" r="4" fill="#34495E"/>
            <line x1="41" y1="36" x2="41" y2="44" stroke="#34495E" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="41" y1="38" x2="48" y2="40" stroke="#34495E" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="41" y1="44" x2="36" y2="54" stroke="#34495E" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="41" y1="44" x2="46" y2="54" stroke="#34495E" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          Lifetime Meters
        </div>
        <div class="lifetime-value">{{ formattedLifetime }}</div>
      </div>

      <div class="year-section">
        <h2 class="year-title">
          <svg class="erg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="20" height="20">
            <defs>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#357ABD;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect x="10" y="45" width="70" height="4" rx="2" fill="url(#grad2)"/>
            <rect x="35" y="40" width="12" height="8" rx="2" fill="#2C3E50"/>
            <line x1="48" y1="44" x2="75" y2="44" stroke="#E74C3C" stroke-width="3" stroke-linecap="round"/>
            <circle cx="77" cy="44" r="3" fill="#E74C3C"/>
            <circle cx="85" cy="44" r="12" fill="none" stroke="url(#grad2)" stroke-width="3"/>
            <circle cx="85" cy="44" r="8" fill="none" stroke="#4A90E2" stroke-width="2"/>
            <line x1="85" y1="36" x2="85" y2="52" stroke="#4A90E2" stroke-width="1.5"/>
            <line x1="77" y1="44" x2="93" y2="44" stroke="#4A90E2" stroke-width="1.5"/>
            <rect x="8" y="50" width="8" height="10" rx="1" fill="#2C3E50"/>
            <circle cx="41" cy="32" r="4" fill="#34495E"/>
            <line x1="41" y1="36" x2="41" y2="44" stroke="#34495E" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="41" y1="38" x2="48" y2="40" stroke="#34495E" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="41" y1="44" x2="36" y2="54" stroke="#34495E" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="41" y1="44" x2="46" y2="54" stroke="#34495E" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          {{ dateRangeLabel }}
        </h2>
        <CircularProgress
          :percentage="percentage"
          :size="circleSize"
          :stroke-width="circleStrokeWidth"
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
        
        <div v-if="!onTrack && behindMessage" class="behind-message">
          {{ behindMessage }}
        </div>
        
        <div class="stats-table">
          <div class="stat-row">
            <span class="stat-label">Today</span>
            <span class="stat-value">{{ formattedToday }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">This Week</span>
            <span class="stat-value">{{ formattedWeek }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">This Month</span>
            <span class="stat-value">{{ formattedMonth }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">This Year</span>
            <span class="stat-value">{{ formattedYear }}</span>
          </div>
        </div>
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
import { computed, ref, onMounted, onUnmounted } from 'vue'
import CircularProgress from '../components/CircularProgress.vue'

const props = defineProps({
  totalMeters: { type: Number, default: 0 },
  lifetimeMeters: { type: Number, default: 0 },
  goal: { type: Number, default: 1_000_000 },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  metersToday: { type: Number, default: 0 },
  metersWeek: { type: Number, default: 0 },
  metersMonth: { type: Number, default: 0 },
  metersYear: { type: Number, default: 0 },
  workouts: { type: Array, default: () => [] }
})

defineEmits(['retry'])

// Responsive circle size
const windowWidth = ref(window.innerWidth)

const circleSize = computed(() => {
  if (windowWidth.value < 640) return 220
  return 280
})

const circleStrokeWidth = computed(() => {
  if (windowWidth.value < 640) return 16
  return 20
})

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})

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

// Calculate average pace from workouts
const averagePaceSeconds = computed(() => {
  if (!props.workouts || props.workouts.length === 0) return null
  
  let totalTime = 0
  let totalDistance = 0
  
  props.workouts.forEach(workout => {
    if (workout.time && workout.distance) {
      totalTime += workout.time / 10 // Convert from tenths to seconds
      totalDistance += workout.distance
    }
  })
  
  if (totalDistance === 0) return null
  
  // Return pace in seconds per 500m
  return (totalTime / totalDistance) * 500
})

// Calculate behind message
const behindMessage = computed(() => {
  if (onTrack.value) return null
  
  const metersBehind = expectedMeters.value - props.totalMeters
  
  if (!averagePaceSeconds.value) {
    return `You're behind by ${metersBehind.toLocaleString()} meters.`
  }
  
  // Calculate time needed at average pace
  const timeNeededSeconds = (metersBehind / 500) * averagePaceSeconds.value
  const hours = Math.floor(timeNeededSeconds / 3600)
  const minutes = Math.floor((timeNeededSeconds % 3600) / 60)
  
  let timeString = ''
  if (hours > 0) {
    timeString = `${hours}h ${minutes}m`
  } else {
    timeString = `${minutes} min`
  }
  
  return `You're behind by ${metersBehind.toLocaleString()} meters. Row for ${timeString} at your average pace to catch up.`
})

const formattedMeters = computed(() => props.totalMeters.toLocaleString())
const formattedGoal = computed(() => props.goal.toLocaleString())
const formattedExpected = computed(() => expectedMeters.value.toLocaleString())
const formattedLifetime = computed(() => props.lifetimeMeters.toLocaleString())
const formattedToday = computed(() => props.metersToday.toLocaleString())
const formattedWeek = computed(() => props.metersWeek.toLocaleString())
const formattedMonth = computed(() => props.metersMonth.toLocaleString())
const formattedYear = computed(() => props.metersYear.toLocaleString())
</script>

<style scoped>
.progress-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

@media (max-width: 640px) {
  .progress-view {
    padding: 0.5rem;
    gap: 1.5rem;
    width: 100%;
  }
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.year-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.erg-icon {
  display: inline-block;
  vertical-align: middle;
}

.lifetime-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #f9fafb;
}

@media (max-width: 640px) {
  .lifetime-value {
    font-size: 1.875rem;
  }
}

.behind-message {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 0.5rem;
  color: #fca5a5;
  font-size: 0.875rem;
  line-height: 1.5;
  text-align: center;
  max-width: 400px;
}

@media (max-width: 640px) {
  .behind-message {
    font-size: 0.8125rem;
    padding: 0.875rem;
    margin-top: 1rem;
  }
}

.stats-table {
  margin-top: 2rem;
  background: #1f2937;
  border-radius: 12px;
  padding: 1rem;
  min-width: 280px;
  width: 100%;
  max-width: 400px;
}

@media (max-width: 640px) {
  .stats-table {
    min-width: unset;
    margin-top: 1.5rem;
  }
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #374151;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 0.875rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 600;
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
