import { createRouter, createWebHistory } from 'vue-router';
const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('@/views/HomeView.vue')
    },
    {
        path: '/test',
        name: 'test',
        component: () => import('@/views/TestView.vue')
    }
];
const router = createRouter({
    history: createWebHistory(),
    routes
});
export default router;
