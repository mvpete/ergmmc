<template>
  <div class="calendar-view">
    <template v-if="loading">
      <div class="loading-state">
        <div class="spinner"></div>
        <span>Loading activity data...</span>
      </div>
    </template>

    <template v-else-if="error">
      <div class="error-state">
        <div class="error-message">{{ error }}</div>
        <button class="retry-btn" @click="$emit('retry')">Retry</button>
      </div>
    </template>

    <template v-else>
      <div class="calendar-intro">
        <h2>Activity History</h2>
        <p class="intro-text">Your rowing journey visualized. Each square represents a day — the greener, the more meters you've logged.</p>
      </div>

      <div class="calendar-header">
        <div class="legend">
          <span class="legend-label">Less</span>
          <div class="legend-squares">
            <div class="square level-0"></div>
            <div class="square level-1"></div>
            <div class="square level-2"></div>
            <div class="square level-3"></div>
            <div class="square level-4"></div>
          </div>
          <span class="legend-label">More</span>
        </div>
      </div>

      <div class="calendar-stats">
        <div class="stat">
          <span class="stat-value">{{ totalWorkouts }}</span>
          <span class="stat-label">total workouts</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ activeDays }}</span>
          <span class="stat-label">active days</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ longestStreak }}</span>
          <span class="stat-label">day streak</span>
        </div>
      </div>

      <div
        v-for="year in years"
        :key="year"
        class="year-calendar"
      >
        <h3 class="year-title">{{ year }}</h3>
        <div class="calendar-container">
          <div class="months">
            <span v-for="month in monthLabels" :key="month">{{ month }}</span>
          </div>
          <div class="calendar-grid">
            <div class="weekdays">
              <span></span>
              <span>Mon</span>
              <span></span>
              <span>Wed</span>
              <span></span>
              <span>Fri</span>
              <span></span>
            </div>
            <div class="squares-container">
              <div
                v-for="(week, weekIndex) in getWeeksForYear(year)"
                :key="weekIndex"
                class="week"
              >
                <div
                  v-for="(day, dayIndex) in week"
                  :key="dayIndex"
                  class="square"
                  :class="day ? `level-${day.level}` : 'empty'"
                  :title="day ? `${day.date}: ${day.meters.toLocaleString()}m` : ''"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p class="calendar-footer" v-if="activeDays > 0">
        Keep it up! Consistency is key to reaching your million meter goal.
      </p>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  allWorkouts: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null }
})

defineEmits(['retry'])

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const dailyMeters = computed(() => {
  const byDate = {}
  props.allWorkouts.forEach(w => {
    const date = w.date?.split(' ')[0] || w.date
    if (date) {
      byDate[date] = (byDate[date] || 0) + (w.distance || 0)
    }
  })
  return byDate
})

const maxDailyMeters = computed(() => {
  const values = Object.values(dailyMeters.value)
  return values.length > 0 ? Math.max(...values) : 0
})

const years = computed(() => {
  const yearSet = new Set()
  props.allWorkouts.forEach(w => {
    const date = w.date?.split(' ')[0] || w.date
    if (date) {
      const year = parseInt(date.split('-')[0])
      if (!isNaN(year)) yearSet.add(year)
    }
  })
  return Array.from(yearSet).sort((a, b) => b - a) // Most recent first
})

function getLevel(meters) {
  if (!meters || meters === 0) return 0
  const ratio = meters / maxDailyMeters.value
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

function getWeeksForYear(year) {
  const result = []
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)

  // Start from first Sunday before or on Jan 1
  const firstDay = new Date(startDate)
  firstDay.setDate(firstDay.getDate() - firstDay.getDay())

  let currentDate = new Date(firstDay)
  let currentWeek = []

  while (currentDate <= endDate || currentWeek.length > 0) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const isInYear = currentDate.getFullYear() === year

    if (isInYear) {
      const meters = dailyMeters.value[dateStr] || 0
      currentWeek.push({
        date: dateStr,
        meters,
        level: getLevel(meters)
      })
    } else if (currentDate < startDate) {
      currentWeek.push(null)
    } else if (currentWeek.length > 0) {
      currentWeek.push(null)
    }

    if (currentWeek.length === 7) {
      result.push(currentWeek)
      currentWeek = []
    }

    currentDate.setDate(currentDate.getDate() + 1)

    if (currentDate > endDate && currentWeek.length === 0) break
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null)
    result.push(currentWeek)
  }

  return result
}

const totalWorkouts = computed(() => props.allWorkouts.length)
const activeDays = computed(() => Object.keys(dailyMeters.value).length)

const longestStreak = computed(() => {
  const dates = Object.keys(dailyMeters.value).sort()
  if (dates.length === 0) return 0

  let maxStreak = 1
  let currentStreak = 1

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }

  return maxStreak
})
</script>

<style scoped>
.calendar-view {
  width: 100%;
  max-width: 900px;
  padding: 1rem;
}

@media (max-width: 640px) {
  .calendar-view {
    padding: 0.5rem;
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

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
}

.error-message {
  color: #f87171;
}

.retry-btn {
  background: #374151;
  border: none;
  color: #f9fafb;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #4b5563;
}

.calendar-intro {
  margin-bottom: 1.5rem;
}

@media (max-width: 640px) {
  .calendar-intro {
    margin-bottom: 1rem;
  }
}

.calendar-intro h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

@media (max-width: 640px) {
  .calendar-intro h2 {
    font-size: 1.25rem;
  }
}

.intro-text {
  color: #9ca3af;
  font-size: 0.875rem;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .intro-text {
    font-size: 0.8125rem;
  }
}

.calendar-footer {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 1.5rem;
  font-style: italic;
}

.calendar-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 1rem;
}

@media (max-width: 640px) {
  .calendar-header {
    justify-content: center;
    margin-bottom: 0.75rem;
  }
}

.legend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

@media (max-width: 640px) {
  .legend {
    gap: 0.25rem;
    font-size: 0.625rem;
  }
}

.legend-squares {
  display: flex;
  gap: 2px;
}

@media (max-width: 640px) {
  .legend-squares {
    gap: 1px;
  }
  
  .legend-squares .square {
    width: 6px;
    height: 6px;
  }
}

.calendar-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #374151;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .calendar-stats {
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
  }
}

.stat {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 80px;
}

@media (max-width: 640px) {
  .stat {
    min-width: 70px;
  }
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

@media (max-width: 640px) {
  .stat-value {
    font-size: 1.25rem;
  }
}

.stat-label {
  font-size: 0.75rem;
  color: #9ca3af;
}

.year-calendar {
  margin-bottom: 2rem;
}

.year-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #f9fafb;
}

.calendar-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 640px) {
  .calendar-container {
    margin: 0 -0.5rem;
    padding: 0 0.5rem;
  }
}

.months {
  display: flex;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-left: 32px;
  margin-bottom: 0.5rem;
}

@media (max-width: 640px) {
  .months {
    font-size: 0.5rem;
    margin-left: 20px;
    margin-bottom: 0.25rem;
  }
}

.months span {
  width: calc(100% / 12);
  min-width: 60px;
}

@media (max-width: 640px) {
  .months span {
    min-width: 25px;
    font-size: 0.5rem;
  }
}

.calendar-grid {
  display: flex;
}

.weekdays {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-right: 4px;
  font-size: 0.625rem;
  color: #9ca3af;
}

@media (max-width: 640px) {
  .weekdays {
    font-size: 0.4rem;
    gap: 1px;
    margin-right: 2px;
  }
}

.weekdays span {
  height: 12px;
  line-height: 12px;
}

@media (max-width: 640px) {
  .weekdays span {
    height: 6px;
    line-height: 6px;
  }
}

.squares-container {
  display: flex;
  gap: 2px;
}

@media (max-width: 640px) {
  .squares-container {
    gap: 1px;
  }
}

.week {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

@media (max-width: 640px) {
  .week {
    gap: 1px;
  }
}

.square {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: #1f2937;
}

@media (max-width: 640px) {
  .square {
    width: 6px;
    height: 6px;
    border-radius: 1px;
  }
}

.square.empty {
  background: transparent;
}

.square.level-0 {
  background: #1f2937;
}

.square.level-1 {
  background: #064e3b;
}

.square.level-2 {
  background: #047857;
}

.square.level-3 {
  background: #10b981;
}

.square.level-4 {
  background: #34d399;
}

.square:not(.empty):hover {
  outline: 1px solid #fff;
  cursor: pointer;
}
</style>
