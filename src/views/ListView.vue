<template>
  <div class="list-view">
    <template v-if="loading">
      <div class="loading-state">
        <div class="spinner"></div>
        <span>Loading history...</span>
      </div>
    </template>

    <template v-else-if="error">
      <div class="error-state">
        <div class="error-message">{{ error }}</div>
        <button class="retry-btn" @click="$emit('retry')">Retry</button>
      </div>
    </template>

    <template v-else-if="allWorkouts.length === 0">
      <div class="empty-state">
        <h2>No Workouts Yet</h2>
        <p>Once you log some meters on your Concept2, they'll appear here.</p>
      </div>
    </template>

    <template v-else>
      <div class="list-header">
        <div class="list-title">
          <h2>Workout History</h2>
          <p class="list-subtitle">Every meter counts. Here's your complete rowing log.</p>
        </div>
        <span class="workout-count">{{ allWorkouts.length }} sessions</span>
      </div>

      <div class="list-container">
      <table>
        <thead>
          <tr>
            <th><span class="full">Date</span><span class="abbr">Date</span></th>
            <th><span class="full">Distance</span><span class="abbr">Dist</span></th>
            <th><span class="full">Time</span><span class="abbr">Time</span></th>
            <th><span class="full">Avg Pace</span><span class="abbr">Pace</span></th>
            <th><span class="full">Avg HR</span><span class="abbr">HR</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="workout in sortedWorkouts" :key="workout.id">
            <td class="date">{{ formatDate(workout.date) }}</td>
            <td class="distance">{{ formatDistance(workout.distance) }}</td>
            <td class="time">{{ workout.time_formatted || formatTime(workout.time) }}</td>
            <td class="pace">{{ calculatePace(workout) }}</td>
            <td class="hr">{{ formatHeartRate(workout) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

      <div class="totals">
        <div class="total-item">
          <span class="total-label">Total Distance</span>
          <span class="total-value">{{ formatDistance(totalDistance) }}</span>
        </div>
        <div class="total-item">
          <span class="total-label">Total Time</span>
          <span class="total-value">{{ formatTotalTime(totalTime) }}</span>
        </div>
        <div class="total-item">
          <span class="total-label">Avg Pace</span>
          <span class="total-value">{{ overallAvgPace }}</span>
        </div>
        <div class="total-item">
          <span class="total-label">Avg HR</span>
          <span class="total-value">{{ overallAvgHR }}</span>
        </div>
      </div>
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

const sortedWorkouts = computed(() => {
  return [...props.allWorkouts].sort((a, b) => {
    return new Date(b.date) - new Date(a.date)
  })
})

const totalDistance = computed(() => {
  return props.allWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0)
})

const totalTime = computed(() => {
  return props.allWorkouts.reduce((sum, w) => sum + (w.time || 0), 0)
})

const overallAvgPace = computed(() => {
  if (totalDistance.value === 0) return '--'
  const paceSeconds = (totalTime.value / 10) / (totalDistance.value / 500)
  return formatPaceSeconds(paceSeconds)
})

const overallAvgHR = computed(() => {
  const workoutsWithHR = props.allWorkouts.filter(w => w.heart_rate?.average)
  if (workoutsWithHR.length === 0) return '--'
  const sum = workoutsWithHR.reduce((s, w) => s + w.heart_rate.average, 0)
  return Math.round(sum / workoutsWithHR.length) + ' bpm'
})

function formatDate(dateStr) {
  if (!dateStr) return '--'
  const [year, month, day] = dateStr.split(' ')[0].split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatDistance(meters) {
  if (!meters) return '--'
  return meters.toLocaleString() + 'm'
}

function formatTime(tenths) {
  if (!tenths) return '--'
  const totalSeconds = Math.floor(tenths / 10)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatTotalTime(tenths) {
  if (!tenths) return '--'
  const totalSeconds = Math.floor(tenths / 10)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

function calculatePace(workout) {
  if (!workout.time || !workout.distance) return '--'
  const paceSeconds = (workout.time / 10) / (workout.distance / 500)
  return formatPaceSeconds(paceSeconds)
}

function formatPaceSeconds(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}/500m`
}

function formatHeartRate(workout) {
  if (!workout.heart_rate?.average) return '--'
  return workout.heart_rate.average + ' bpm'
}
</script>

<style scoped>
.list-view {
  width: 100%;
  max-width: 900px;
  padding: 1rem;
}

@media (max-width: 640px) {
  .list-view {
    padding: 0.5rem;
    max-width: 100vw;
    overflow-x: hidden;
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

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
}

.empty-state h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #f9fafb;
  margin-bottom: 0.5rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .list-header {
    flex-direction: column;
    gap: 0.5rem;
  }
}

.list-title h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

@media (max-width: 640px) {
  .list-title h2 {
    font-size: 1.25rem;
  }
}

.list-subtitle {
  color: #9ca3af;
  font-size: 0.875rem;
}

.workout-count {
  color: #9ca3af;
  font-size: 0.875rem;
}

.list-container {
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 640px) {
  .list-container {
    margin: 0;
    padding: 0;
    max-height: 350px;
    overflow-x: hidden;
  }
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 500px;
}

@media (max-width: 640px) {
  table {
    min-width: 100%;
    font-size: 0.75rem;
  }
}

th {
  text-align: left;
  padding: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
  border-bottom: 1px solid #374151;
  position: sticky;
  top: 0;
  background: #111827;
}

th .abbr {
  display: none;
}

@media (max-width: 640px) {
  th {
    padding: 0.5rem 0.125rem;
    font-size: 0.5rem;
    letter-spacing: 0;
  }
  
  th .full {
    display: none;
  }
  
  th .abbr {
    display: inline;
  }
}

td {
  padding: 0.75rem;
  font-size: 0.875rem;
  border-bottom: 1px solid #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 640px) {
  td {
    padding: 0.5rem 0.125rem;
    font-size: 0.6875rem;
  }
}

tr:hover td {
  background: #1f2937;
}

.date {
  color: #9ca3af;
}

.distance {
  font-weight: 600;
}

.pace {
  font-family: monospace;
}

.hr {
  color: #f87171;
}

.totals {
  display: flex;
  gap: 2rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #374151;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .totals {
    gap: 1rem;
    margin-top: 1rem;
    padding-top: 1rem;
  }
}

.total-item {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 100px;
}

@media (max-width: 640px) {
  .total-item {
    min-width: 80px;
  }
}

.total-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (max-width: 640px) {
  .total-label {
    font-size: 0.625rem;
  }
}

.total-value {
  font-size: 1.25rem;
  font-weight: 700;
  margin-top: 0.25rem;
}

@media (max-width: 640px) {
  .total-value {
    font-size: 1.125rem;
  }
}
</style>
