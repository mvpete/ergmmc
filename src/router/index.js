import { createRouter, createWebHistory } from 'vue-router'
import ProgressView from '../views/ProgressView.vue'
import CalendarView from '../views/CalendarView.vue'
import ListView from '../views/ListView.vue'

const routes = [
  { path: '/', name: 'progress', component: ProgressView },
  { path: '/calendar', name: 'calendar', component: CalendarView },
  { path: '/list', name: 'list', component: ListView },
  { path: '/callback', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
