import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initMobileAdapter } from './utils/mobileAdapter'
import { registerServiceWorker } from './pwa/register-service-worker'

// 引入Vant组件库
import Vant from 'vant'
import 'vant/lib/index.css'

// 引入全局样式
import '@/styles/index.scss'

// 创建应用实例
const app = createApp(App)

// 注册路由
app.use(router)

// 注册UI组件库
app.use(Vant)

// 初始化移动端适配
initMobileAdapter()

// 注册Service Worker
registerServiceWorker()

// 挂载应用
app.mount('#app') 