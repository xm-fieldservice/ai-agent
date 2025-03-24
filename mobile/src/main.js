import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import vant from 'vant'
import 'vant/lib/index.css'
import './styles/index.scss'
import './pwa'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vant)

app.mount('#app') 