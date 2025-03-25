# AI助手移动端模块

本文档介绍AI助手移动端模块的架构、功能和使用方法。

## 目录

- [项目介绍](#项目介绍)
- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [目录结构](#目录结构)
- [PWA功能](#pwa功能)
- [移动端适配](#移动端适配)
- [监控与调试](#监控与调试)
- [测试指南](#测试指南)
- [部署指南](#部署指南)
- [常见问题](#常见问题)

## 项目介绍

AI助手移动端模块是一个基于Vue 3、TypeScript和Vite构建的移动端PWA应用。它提供了完整的离线支持、安装提示和移动端适配优化，为用户提供流畅的AI助手体验。

### 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Vant
- **路由管理**: Vue Router
- **PWA支持**: Service Worker + Web Manifest
- **测试框架**: Jest

## 功能特性

### PWA支持
- ✅ 完整的离线访问支持
- ✅ 应用安装提示
- ✅ 后台同步能力
- ✅ 自动更新检测

### 移动端优化
- ✅ 键盘行为优化
- ✅ 安全区域适配
- ✅ 手势操作支持
- ✅ 网络状态检测

### 监控与调试
- ✅ 完整的日志系统
- ✅ 性能指标采集
- ✅ 网络请求监控
- ✅ 测试环境支持

## 快速开始

### 安装依赖

```bash
# 进入移动端目录
cd mobile

# 安装依赖
npm install
```

### 启动开发服务器

```bash
# 开发模式
npm run dev

# 测试模式（带调试面板）
npm run dev -- --config vite.test.config.js
```

### 构建项目

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 运行测试

```bash
# 运行所有测试
npm run test

# 带覆盖率报告
npm run test:coverage
```

## 目录结构

```
mobile/
├── public/               # 静态资源
│   ├── icons/            # 应用图标
│   │   └── manifest.json     # PWA配置
│   │   └── sw.js             # Service Worker
│   │   └── offline.html      # 离线页面
│   ├── src/
│   │   ├── components/       # 组件目录
│   │   │   └── InstallPrompt.vue     # 安装提示组件
│   │   │   └── NetworkStatus.vue     # 网络状态组件
│   │   │   └── GestureFeedback.vue   # 手势反馈组件
│   │   ├── pwa/              # PWA相关功能
│   │   │   └── register-service-worker.js
│   │   ├── router/           # 路由配置
│   │   ├── utils/            # 工具函数
│   │   │   └── mobileAdapter.ts       # 移动端适配工具
│   │   │   └── logger.ts              # 日志系统
│   │   │   └── performance.ts         # 性能监控
│   │   │   └── network-monitor.ts     # 网络监控
│   │   │   └── monitor.ts             # 监控统一接口
│   │   ├── views/            # 页面组件
│   │   ├── App.vue           # 根组件
│   │   ├── main.ts           # 入口文件
│   │   └── main-test.ts      # 测试入口
│   ├── tests/                # 测试文件
│   │   └── setup.js          # 测试环境配置
│   │   └── __tests__/        # 测试用例
│   ├── vite.config.ts        # Vite配置
│   └── jest.config.js        # Jest配置
```

## PWA功能

### Service Worker

Service Worker提供了离线缓存和后台同步功能，它的主要功能包括：

1. **缓存策略**：
   - 静态资源：缓存优先
   - API请求：网络优先，离线时使用缓存
   - 动态内容：网络优先，并更新缓存

2. **离线支持**：
   - 当网络不可用时，自动提供离线页面
   - 缓存关键资源，确保基础功能可用

3. **更新机制**：
   - 自动检测新版本
   - 提示用户刷新使用新版本

使用示例：

```javascript
// 注册Service Worker
import { registerServiceWorker } from '@/pwa/register-service-worker';

// 在应用启动时调用
registerServiceWorker();
```

### 安装提示

当用户可以安装应用时，会显示自定义的安装提示，引导用户安装到桌面：

```javascript
// 显示安装提示
import { showInstallPrompt } from '@/pwa/register-service-worker';

// 手动触发安装提示
showInstallPrompt();
```

InstallPrompt组件提供了美观的安装界面，自动处理安装流程。

## 移动端适配

### 移动端适配工具

`mobileAdapter.ts`提供了全面的移动端适配功能：

1. **设备检测**：
   ```typescript
   import { isIOS, isAndroid, isMobile } from '@/utils/mobileAdapter';
   
   if (isIOS) {
     // iOS特定处理
   }
   ```

2. **键盘处理**：
   ```typescript
   import { keyboardHeight, isKeyboardVisible } from '@/utils/mobileAdapter';
   
   // 响应式使用键盘高度
   const contentHeight = computed(() => {
     return `calc(100vh - ${keyboardHeight.value}px)`;
   });
   ```

3. **安全区域**：
   ```scss
   // 在CSS中使用
   .safe-container {
     padding-top: var(--safe-area-top);
     padding-bottom: var(--safe-area-bottom);
   }
   ```

4. **手势支持**：
   - 下拉刷新：从页面顶部下拉触发刷新
   - 返回手势：从屏幕左边缘右滑触发返回
   - 自定义手势：通过监听`pullToRefresh`和`backGesture`事件使用

初始化方法：

```typescript
import { initMobileAdapter } from '@/utils/mobileAdapter';

// 在应用启动时初始化
initMobileAdapter();
```

## 监控与调试

### 日志系统

日志系统提供了统一的日志记录和管理：

```typescript
import logger, { LogLevel, LogType } from '@/utils/logger';

// 记录不同级别的日志
logger.debug('调试信息');
logger.info('普通信息');
logger.warn('警告信息');
logger.error('错误信息', new Error('发生错误'));

// 记录特定类型的日志
logger.info('网络请求完成', { url: '/api/data' }, LogType.NETWORK);

// 获取日志
const allLogs = logger.getLogs();
const errorLogs = logger.getLogs(LogLevel.ERROR);
```

### 性能监控

性能监控工具自动采集Web Vitals等性能指标，同时支持自定义性能度量：

```typescript
import performanceMonitor from '@/utils/performance';

// 自定义性能测量
const duration = performanceMonitor.measure('操作耗时', 'start-mark', 'end-mark');

// 获取性能报告
const report = performanceMonitor.getPerformanceReport();
```

### 网络监控

网络监控工具拦截和记录所有网络请求：

```typescript
import networkMonitor from '@/utils/network-monitor';

// 获取请求记录
const requests = networkMonitor.getRequests();

// 获取网络统计
const stats = networkMonitor.getNetworkStats();
```

### 统一监控接口

```typescript
import { initMonitoring } from '@/utils/monitor';

// 初始化所有监控
const monitoring = initMonitoring({
  environment: 'development',
  appVersion: '1.0.0',
  logger: {
    enabled: true,
    logLevel: 'info'
  }
});
```

## 测试指南

### 单元测试

使用Jest运行单元测试：

```bash
# 运行所有测试
npm run test

# 运行特定测试
npm run test -- -t "日志系统"
```

### 手动测试

可以使用测试面板进行手动测试：

1. 启动测试模式：`npm run dev -- --config vite.test.config.js`
2. 使用测试面板生成测试数据和查看监控信息
3. 使用网络模拟功能测试离线行为

## 部署指南

### 构建优化

1. **图片优化**：
   - 使用WebP格式
   - 提供多种尺寸的图标

2. **代码分割**：
   - 路由级别代码分割
   - 懒加载非关键组件

3. **资源压缩**：
   - 启用Brotli/Gzip压缩
   - 最小化CSS/JS文件

### 部署步骤

1. 构建项目：`npm run build`
2. 测试生产版本：`npm run preview`
3. 将`dist`目录部署到Web服务器
4. 确保服务器配置正确的MIME类型和缓存控制
5. 配置HTTPS（PWA必需）

## 常见问题

### Service Worker不工作

**问题**：Service Worker未注册或未激活。

**解决方案**：
- 确保使用HTTPS或localhost
- 检查Service Worker注册代码
- 清除浏览器缓存后重试

### 安装提示不显示

**问题**：PWA安装提示没有显示。

**解决方案**：
- 确保manifest.json配置正确
- 确保用户未安装过应用
- 确保满足PWA安装条件（HTTPS、有图标等）

### 移动端适配问题

**问题**：某些设备上的样式不正确。

**解决方案**：
- 检查CSS变量计算
- 确保使用了正确的视口设置
- 使用设备特定的样式修复

### 性能监控失败

**问题**：性能指标未收集。

**解决方案**：
- 确保浏览器支持Performance API
- 检查控制台错误信息
- 降级处理不支持的浏览器

---

如有更多问题，请联系开发团队。 