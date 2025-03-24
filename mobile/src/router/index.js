import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/test',
    name: 'test',
    component: () => import('../components/CommunicationTest.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 