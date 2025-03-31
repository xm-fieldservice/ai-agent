/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
export default (await import('vue')).defineComponent({
    name: 'PWATest',
    data() {
        return {
            installPrompt: false,
            isOnline: navigator.onLine,
            cachedResources: [],
            deferredPrompt: null,
            performanceResults: null
        };
    },
    mounted() {
        // 监听在线状态
        window.addEventListener('online', this.updateOnlineStatus);
        window.addEventListener('offline', this.updateOnlineStatus);
        // 监听安装提示
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.installPrompt = true;
        });
        // 获取缓存资源
        this.getCachedResources();
    },
    beforeDestroy() {
        window.removeEventListener('online', this.updateOnlineStatus);
        window.removeEventListener('offline', this.updateOnlineStatus);
    },
    methods: {
        updateOnlineStatus() {
            this.isOnline = navigator.onLine;
        },
        async installPWA() {
            if (!this.deferredPrompt)
                return;
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            this.installPrompt = false;
            this.deferredPrompt = null;
        },
        async getCachedResources() {
            if ('caches' in window) {
                const cache = await caches.open('ai-assistant-v1');
                const keys = await cache.keys();
                this.cachedResources = keys.map(key => key.url);
            }
        },
        async requestNotificationPermission() {
            try {
                const permission = await Notification.requestPermission();
                alert(`通知权限状态: ${permission}`);
            }
            catch (error) {
                console.error('请求通知权限失败:', error);
            }
        },
        async sendTestNotification() {
            if (!('serviceWorker' in navigator)) {
                alert('您的浏览器不支持Service Worker');
                return;
            }
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification('测试通知', {
                    body: '这是一条测试通知',
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/badge.png',
                    vibrate: [100, 50, 100]
                });
            }
            catch (error) {
                console.error('发送通知失败:', error);
            }
        },
        async testPerformance() {
            if (!window.performance) {
                alert('您的浏览器不支持Performance API');
                return;
            }
            const timing = window.performance.timing;
            this.performanceResults = {
                firstContentfulPaint: timing.responseEnd - timing.navigationStart,
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                load: timing.loadEventEnd - timing.navigationStart
            };
        }
    }
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pwa-test" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
if (__VLS_ctx.installPrompt) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "install-prompt" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.installPWA) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.installPrompt))
                    return;
                __VLS_ctx.installPrompt = false;
            } },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "offline-status" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.isOnline ? '在线' : '离线');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "cache-status" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.cachedResources.length);
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
for (const [resource] of __VLS_getVForSourceType((__VLS_ctx.cachedResources))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
        key: (resource),
    });
    (resource);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "notification-test" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.requestNotificationPermission) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.sendTestNotification) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "performance-test" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.testPerformance) },
});
if (__VLS_ctx.performanceResults) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "results" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.performanceResults.firstContentfulPaint);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.performanceResults.domContentLoaded);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.performanceResults.load);
}
/** @type {__VLS_StyleScopedClasses['pwa-test']} */ ;
/** @type {__VLS_StyleScopedClasses['install-prompt']} */ ;
/** @type {__VLS_StyleScopedClasses['offline-status']} */ ;
/** @type {__VLS_StyleScopedClasses['cache-status']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-test']} */ ;
/** @type {__VLS_StyleScopedClasses['performance-test']} */ ;
/** @type {__VLS_StyleScopedClasses['results']} */ ;
var __VLS_dollars;
let __VLS_self;
