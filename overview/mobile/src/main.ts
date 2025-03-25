import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { featureClient } from './services/feature-client';

const app = createApp(App);

app.use(router);

// 初始化功能客户端
featureClient.fetchFeatures().then(() => {
  console.log('功能列表已加载');
}).catch(error => {
  console.error('加载功能列表失败:', error);
});

// 将功能客户端注入全局
app.config.globalProperties.$features = featureClient;

// 声明全局属性类型
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $features: typeof featureClient;
  }
}

app.mount('#app'); 