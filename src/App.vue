<template>
  <div class="app">
    <template v-if="!authenticated">
      <div class="container">
        <h1 style="margin-bottom: 2rem; font-size: 1.5rem;">Million Meter Club</h1>
        <div v-if="loading" style="margin-bottom: 1rem; color: #9ca3af;">
          Authenticating...
        </div>
        <div v-if="error" class="error" style="margin-bottom: 1rem;">
          {{ error }}
        </div>
        <button class="connect-btn" @click="connect" :disabled="loading">
          Connect to Concept2
        </button>
      </div>
    </template>

    <template v-else>
      <h1 class="app-title">Million Meter Club</h1>
      <nav class="tabs">
        <router-link to="/" class="tab" :class="{ active: $route.path === '/' }">
          Progress
        </router-link>
        <router-link to="/calendar" class="tab" :class="{ active: $route.path === '/calendar' }">
          Calendar
        </router-link>
        <router-link to="/list" class="tab" :class="{ active: $route.path === '/list' }">
          History
        </router-link>
      </nav>

      <main class="main-content">
        <router-view
          :workouts="filteredWorkouts"
          :all-workouts="allWorkouts"
          :total-meters="totalMeters"
          :lifetime-meters="lifetimeMeters"
          :goal="settings.goal"
          :start-date="settings.startDate"
          :end-date="settings.endDate"
          :meters-today="metersToday"
          :meters-week="metersWeek"
          :meters-month="metersMonth"
          :meters-year="metersYear"
          :loading="loading"
          :error="error"
          @retry="loadData"
        />
      </main>

      <div class="footer-buttons">
        <button class="footer-btn" @click="showSettings = true">Settings</button>
        <button class="footer-btn disconnect" @click="disconnect">Disconnect</button>
      </div>

      <SettingsModal
        v-if="showSettings"
        :settings="settings"
        @close="showSettings = false"
        @save="saveSettings"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import SettingsModal from './components/SettingsModal.vue'
import {
  getAuthUrl,
  exchangeCodeForToken,
  saveToken,
  clearToken,
  isAuthenticated,
  fetchAllResults,
  calculateTotalMeters
} from './services/concept2Api.js'

const SETTINGS_KEY = 'mmc_settings'

function getDefaultSettings() {
  const year = new Date().getFullYear()
  return {
    goal: 1_000_000,
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`
  }
}

function loadSettings() {
  const saved = localStorage.getItem(SETTINGS_KEY)
  if (saved) {
    try {
      return { ...getDefaultSettings(), ...JSON.parse(saved) }
    } catch {
      return getDefaultSettings()
    }
  }
  return getDefaultSettings()
}

const authenticated = ref(false)
const loading = ref(false)
const error = ref(null)
const allWorkouts = ref([])
const showSettings = ref(false)
const settings = reactive(loadSettings())

function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const filteredWorkouts = computed(() => {
  const start = parseLocalDate(settings.startDate)
  const end = parseLocalDate(settings.endDate)
  end.setHours(23, 59, 59, 999)

  return allWorkouts.value.filter(w => {
    const dateStr = w.date?.split(' ')[0] || w.date
    const date = parseLocalDate(dateStr)
    return date >= start && date <= end
  })
})

const totalMeters = computed(() => calculateTotalMeters(filteredWorkouts.value))
const lifetimeMeters = computed(() => calculateTotalMeters(allWorkouts.value))

const metersToday = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayWorkouts = allWorkouts.value.filter(w => {
    const dateStr = w.date?.split(' ')[0] || w.date
    const date = parseLocalDate(dateStr)
    date.setHours(0, 0, 0, 0)
    return date.getTime() === today.getTime()
  })
  return calculateTotalMeters(todayWorkouts)
})

const metersWeek = computed(() => {
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)
  
  const weekWorkouts = allWorkouts.value.filter(w => {
    const dateStr = w.date?.split(' ')[0] || w.date
    const date = parseLocalDate(dateStr)
    return date >= startOfWeek && date <= endOfWeek
  })
  return calculateTotalMeters(weekWorkouts)
})

const metersMonth = computed(() => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const startOfMonth = new Date(year, month, 1)
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999)
  
  const monthWorkouts = allWorkouts.value.filter(w => {
    const dateStr = w.date?.split(' ')[0] || w.date
    const date = parseLocalDate(dateStr)
    return date >= startOfMonth && date <= endOfMonth
  })
  return calculateTotalMeters(monthWorkouts)
})

const metersYear = computed(() => {
  const today = new Date()
  const year = today.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999)
  
  const yearWorkouts = allWorkouts.value.filter(w => {
    const dateStr = w.date?.split(' ')[0] || w.date
    const date = parseLocalDate(dateStr)
    return date >= startOfYear && date <= endOfYear
  })
  return calculateTotalMeters(yearWorkouts)
})

function connect() {
  window.location.href = getAuthUrl()
}

function disconnect() {
  clearToken()
  authenticated.value = false
  allWorkouts.value = []
}

function saveSettings(newSettings) {
  Object.assign(settings, newSettings)
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  showSettings.value = false
}

async function handleCallback() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')

  if (code) {
    try {
      loading.value = true
      error.value = null
      console.log('Exchanging code for token...')
      const tokenData = await exchangeCodeForToken(code)
      console.log('Token received:', tokenData)
      saveToken(tokenData)
      window.history.replaceState({}, '', '/')
      authenticated.value = true
      await loadData()
    } catch (err) {
      console.error('Authentication failed:', err)
      error.value = `Failed to authenticate: ${err.message}`
      loading.value = false
    }
  }
}

async function loadData() {
  try {
    loading.value = true
    error.value = null
    console.log('Fetching workout results...')
    allWorkouts.value = await fetchAllResults()
    console.log('Workouts loaded:', allWorkouts.value.length)
  } catch (err) {
    console.error('Load data error:', err)
    // If token was cleared due to auth failure, kick user out
    if (!isAuthenticated()) {
      authenticated.value = false
      allWorkouts.value = []
      return
    }
    error.value = `Failed to load data: ${err.message}`
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  if (params.has('code')) {
    await handleCallback()
  } else if (isAuthenticated()) {
    authenticated.value = true
    await loadData()
  }
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.app-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f9fafb;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.tabs {
  display: flex;
  gap: 0;
  margin-top: 1rem;
  background: #1f2937;
  border-radius: 0.5rem;
  padding: 0.25rem;
}

.tab {
  padding: 0.5rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #9ca3af;
  text-decoration: none;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.tab:hover {
  color: #f9fafb;
}

.tab.active {
  background: #374151;
  color: #f9fafb;
}

.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 2rem;
}

.footer-buttons {
  display: flex;
  gap: 0.75rem;
  margin: 1rem 0 2rem;
}

.footer-btn {
  background: transparent;
  border: 1px solid #374151;
  color: #9ca3af;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.footer-btn:hover {
  border-color: #6b7280;
  color: #f9fafb;
}

.footer-btn.disconnect:hover {
  border-color: #f87171;
  color: #f87171;
}
</style>
