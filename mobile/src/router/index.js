import { createRouter, createWebHistory } from 'vue-router'
import PWATest from '../pages/PWATest.vue'

const routes = [
  {
    path: '/',
    redirect: '/pwa-test'
  },
  {
    path: '/pwa-test',
    name: 'PWATest',
    component: PWATest
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 