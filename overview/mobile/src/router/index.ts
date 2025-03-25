import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import ChatView from '../views/ChatView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: ChatView
  },
  {
    path: '/about',
    name: 'about',
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  },
  {
    path: '/chat',
    name: 'chat',
    component: ChatView
  },
  {
    path: '/notes',
    name: 'notes',
    component: ChatView,
    props: { defaultFeatureType: 'notes' }
  },
  {
    path: '/llm',
    name: 'llm',
    component: ChatView,
    props: { defaultFeatureType: 'llm' }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router; 