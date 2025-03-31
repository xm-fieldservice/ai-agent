/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref } from 'vue';
import { showToast } from 'vant';
import { useMessageStore } from '../stores/message';
// 服务器配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// 封装fetch请求
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        console.log('Fetching:', url); // 添加调试日志
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            mode: 'cors', // 确保启用CORS
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        clearTimeout(id);
        return response;
    }
    catch (error) {
        clearTimeout(id);
        console.error('Fetch error:', error); // 添加错误日志
        throw error;
    }
}
const messageStore = useMessageStore();
// 状态变量
const testMessage = ref('');
const messageType = ref('chat');
const sending = ref(false);
const loading = ref({
    node: false,
    pm: false,
    network: false,
    db: false,
    resources: false
});
const streamTesting = ref(false);
const status = ref('pending');
const statusText = ref('等待测试');
const responseData = ref('');
const error = ref('');
const streamContent = ref('');
const streamProgress = ref(0);
// 测试配置
const testType = ref('normal');
const simulateError = ref(false);
const simulateDelay = ref(0);
const testTypeOptions = [
    { text: '普通测试', value: 'normal' },
    { text: '并发测试', value: 'concurrent' },
    { text: '超时测试', value: 'timeout' },
    { text: '断网测试', value: 'offline' }
];
// 环境测试相关
const envTestResults = ref([]);
const envResults = ref({});
// 格式化JSON数据
const formatJson = (data) => {
    try {
        return JSON.stringify(data, null, 2);
    }
    catch (err) {
        return data;
    }
};
// 测试发送消息
const testSendMessage = async () => {
    if (!testMessage.value) {
        showToast('请输入测试消息');
        return;
    }
    sending.value = true;
    status.value = 'pending';
    statusText.value = '发送中...';
    error.value = '';
    try {
        // 模拟延迟
        if (simulateDelay.value > 0) {
            await new Promise(resolve => setTimeout(resolve, simulateDelay.value));
        }
        // 模拟错误
        if (simulateError.value) {
            throw new Error('模拟的错误情况');
        }
        // 并发测试
        if (testType.value === 'concurrent') {
            const promises = Array(3).fill().map(() => messageStore.sendMessage({
                type: messageType.value,
                content: testMessage.value
            }));
            const responses = await Promise.all(promises);
            responseData.value = responses;
            status.value = 'success';
            statusText.value = '并发发送成功';
            return;
        }
        // 断网测试
        if (testType.value === 'offline') {
            // 模拟断网
            const originalOnline = navigator.onLine;
            Object.defineProperty(navigator, 'onLine', { value: false });
            try {
                await messageStore.sendMessage({
                    type: messageType.value,
                    content: testMessage.value
                });
            }
            finally {
                // 恢复在线状态
                Object.defineProperty(navigator, 'onLine', { value: originalOnline });
            }
        }
        // 超时测试
        if (testType.value === 'timeout') {
            await messageStore.sendMessage({
                type: messageType.value,
                content: testMessage.value,
                timeout: 1000 // 1秒超时
            });
        }
        // 普通测试
        const response = await messageStore.sendMessage({
            type: messageType.value,
            content: testMessage.value
        });
        status.value = 'success';
        statusText.value = '发送成功';
        responseData.value = response;
    }
    catch (err) {
        status.value = 'error';
        statusText.value = '发送失败';
        error.value = err.message;
        showToast({
            type: 'fail',
            message: '发送失败：' + err.message
        });
    }
    finally {
        sending.value = false;
    }
};
// 测试连接
const testConnection = async () => {
    loading.value = true;
    status.value = 'pending';
    statusText.value = '测试中...';
    error.value = '';
    try {
        const response = await messageStore.testConnection();
        status.value = 'success';
        statusText.value = '连接正常';
        responseData.value = response;
        showToast({
            type: 'success',
            message: '连接测试成功'
        });
    }
    catch (err) {
        status.value = 'error';
        statusText.value = '连接失败';
        error.value = err.message;
        showToast({
            type: 'fail',
            message: '连接失败：' + err.message
        });
    }
    finally {
        loading.value = false;
    }
};
// 测试流式响应
const testStreamResponse = async () => {
    streamTesting.value = true;
    streamContent.value = '';
    streamProgress.value = 0;
    status.value = 'pending';
    statusText.value = '测试流式响应中...';
    error.value = '';
    let retryCount = 0;
    const maxRetries = 3;
    const tryStreamResponse = async () => {
        try {
            await messageStore.testStreamResponse({
                onMessage: (text) => {
                    streamContent.value += text;
                },
                onProgress: (progress) => {
                    streamProgress.value = progress;
                },
                onError: (err) => {
                    console.error('Stream error:', err);
                    if (retryCount < maxRetries) {
                        retryCount++;
                        console.log(`Retrying... (${retryCount}/${maxRetries})`);
                        return tryStreamResponse();
                    }
                    throw err;
                }
            });
            status.value = 'success';
            statusText.value = '流式响应完成';
        }
        catch (err) {
            if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Retrying... (${retryCount}/${maxRetries})`);
                return tryStreamResponse();
            }
            status.value = 'error';
            statusText.value = '流式响应失败';
            error.value = err.message;
            showToast({
                type: 'fail',
                message: `流式响应失败 (重试${retryCount}次): ${err.message}`
            });
        }
    };
    try {
        await tryStreamResponse();
    }
    finally {
        streamTesting.value = false;
    }
};
// 测试环境兼容性
const testEnvironment = async () => {
    envTestResults.value = [];
    status.value = 'pending';
    // Node.js 版本检测
    try {
        const response = await fetch('http://localhost:8000/system/node-version');
        const nodeVersion = await response.json();
        envTestResults.value.push({
            label: 'Node.js版本',
            value: nodeVersion.version,
            status: nodeVersion.compatible ? 'success' : 'warning',
            statusText: nodeVersion.compatible ? '兼容' : '可能不兼容'
        });
    }
    catch (err) {
        envTestResults.value.push({
            label: 'Node.js版本',
            value: '检测失败',
            status: 'error',
            statusText: err.message
        });
    }
    // 包管理器检测
    try {
        const response = await fetch('http://localhost:8000/system/package-manager');
        const pkgManager = await response.json();
        envTestResults.value.push({
            label: '包管理器',
            value: pkgManager.name,
            status: 'success',
            statusText: '正常'
        });
    }
    catch (err) {
        envTestResults.value.push({
            label: '包管理器',
            value: '检测失败',
            status: 'error',
            statusText: err.message
        });
    }
    // 网络环境检测
    try {
        const response = await fetch('http://localhost:8000/system/network');
        const network = await response.json();
        envTestResults.value.push({
            label: '网络环境',
            value: `${network.protocol} | ${network.cors ? 'CORS已配置' : 'CORS未配置'}`,
            status: network.secure ? 'success' : 'warning',
            statusText: network.secure ? '安全' : '不安全'
        });
    }
    catch (err) {
        envTestResults.value.push({
            label: '网络环境',
            value: '检测失败',
            status: 'error',
            statusText: err.message
        });
    }
};
// 测试数据库连接
const testDatabase = async () => {
    try {
        const response = await fetch('http://localhost:8000/system/database');
        const dbStatus = await response.json();
        envTestResults.value = [{
                label: '数据库连接',
                value: `${dbStatus.type} | ${dbStatus.version}`,
                status: dbStatus.connected ? 'success' : 'error',
                statusText: dbStatus.connected ? '已连接' : '未连接'
            }];
    }
    catch (err) {
        envTestResults.value = [{
                label: '数据库连接',
                value: '检测失败',
                status: 'error',
                statusText: err.message
            }];
    }
};
// 测试PWA功能
const testPWA = async () => {
    envTestResults.value = [];
    // Service Worker 检测
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            envTestResults.value.push({
                label: 'Service Worker',
                value: registration ? '已注册' : '未注册',
                status: registration ? 'success' : 'warning',
                statusText: registration ? '正常' : '需要注册'
            });
        }
        catch (err) {
            envTestResults.value.push({
                label: 'Service Worker',
                value: '检测失败',
                status: 'error',
                statusText: err.message
            });
        }
    }
    // 缓存存储检测
    try {
        const storage = await navigator.storage.estimate();
        envTestResults.value.push({
            label: '缓存存储',
            value: `${Math.round(storage.usage / 1024 / 1024)}MB / ${Math.round(storage.quota / 1024 / 1024)}MB`,
            status: 'success',
            statusText: '正常'
        });
    }
    catch (err) {
        envTestResults.value.push({
            label: '缓存存储',
            value: '检测失败',
            status: 'error',
            statusText: err.message
        });
    }
    // 推送API检测
    if ('Notification' in window) {
        envTestResults.value.push({
            label: '推送通知',
            value: Notification.permission,
            status: Notification.permission === 'granted' ? 'success' : 'warning',
            statusText: Notification.permission === 'granted' ? '已授权' : '未授权'
        });
    }
};
// 环境测试函数
const testNodeVersion = async () => {
    loading.value.node = true;
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/system/node-version`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        envResults.value.node = data;
        showToast({
            type: 'success',
            message: '检测成功'
        });
    }
    catch (error) {
        console.error('Node版本测试失败:', error);
        showToast({
            type: 'fail',
            message: error.name === 'AbortError' ? '请求超时' : `检测失败: ${error.message}`
        });
        envResults.value.node = {
            version: '未知',
            compatible: false,
            error: error.name === 'AbortError' ? '请求超时' : error.message
        };
    }
    loading.value.node = false;
};
const testPackageManager = async () => {
    loading.value.pm = true;
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/system/package-manager`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        envResults.value.pm = data;
        showToast({
            type: 'success',
            message: '检测成功'
        });
    }
    catch (error) {
        console.error('包管理器测试失败:', error);
        showToast({
            type: 'fail',
            message: error.name === 'AbortError' ? '请求超时' : `检测失败: ${error.message}`
        });
        envResults.value.pm = {
            name: '未知',
            version: '0.0.0',
            error: error.name === 'AbortError' ? '请求超时' : error.message
        };
    }
    loading.value.pm = false;
};
const testNetwork = async () => {
    loading.value.network = true;
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/system/network`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        envResults.value.network = data;
        showToast({
            type: 'success',
            message: '检测成功'
        });
    }
    catch (error) {
        console.error('网络环境测试失败:', error);
        showToast({
            type: 'fail',
            message: error.name === 'AbortError' ? '请求超时' : `检测失败: ${error.message}`
        });
        envResults.value.network = {
            protocol: 'unknown',
            cors: false,
            secure: false,
            error: error.name === 'AbortError' ? '请求超时' : error.message
        };
    }
    loading.value.network = false;
};
const testDatabaseConnection = async () => {
    loading.value.db = true;
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/system/database`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        envResults.value.db = data;
        showToast({
            type: 'success',
            message: '检测成功'
        });
    }
    catch (error) {
        console.error('数据库测试失败:', error);
        showToast({
            type: 'fail',
            message: error.name === 'AbortError' ? '请求超时' : `检测失败: ${error.message}`
        });
        envResults.value.db = {
            type: '未知',
            version: '0.0',
            connected: false,
            error: error.name === 'AbortError' ? '请求超时' : error.message
        };
    }
    loading.value.db = false;
};
async function testResources() {
    loading.value.resources = true;
    try {
        const response = await fetch('http://localhost:8000/system/resources');
        envResults.value.resources = await response.json();
    }
    catch (error) {
        console.error('系统资源测试失败:', error);
    }
    loading.value.resources = false;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['status']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "communication-test" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "test-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "test-buttons" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.testNodeVersion) },
    ...{ class: ({ loading: __VLS_ctx.loading.node }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.testPackageManager) },
    ...{ class: ({ loading: __VLS_ctx.loading.pm }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.testNetwork) },
    ...{ class: ({ loading: __VLS_ctx.loading.network }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.testDatabaseConnection) },
    ...{ class: ({ loading: __VLS_ctx.loading.db }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.testResources) },
    ...{ class: ({ loading: __VLS_ctx.loading.resources }) },
});
if (__VLS_ctx.envResults) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "test-results" },
    });
    if (__VLS_ctx.envResults.node) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "result-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.envResults.node.version);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.envResults.node.compatible ? '兼容' : '不兼容');
        if (__VLS_ctx.envResults.node.error) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "error-message" },
            });
            (__VLS_ctx.envResults.node.error);
        }
    }
    if (__VLS_ctx.envResults.pm) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "result-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.envResults.pm.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.envResults.pm.version);
        if (__VLS_ctx.envResults.pm.error) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "error-message" },
            });
            (__VLS_ctx.envResults.pm.error);
        }
    }
    if (__VLS_ctx.envResults.network) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "result-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.envResults.network.protocol);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.envResults.network.cors ? '已启用' : '未启用');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.envResults.network.secure ? '安全' : '不安全');
        if (__VLS_ctx.envResults.network.error) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "error-message" },
            });
            (__VLS_ctx.envResults.network.error);
        }
    }
    if (__VLS_ctx.envResults.db) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "result-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.envResults.db.type);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.envResults.db.version);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.envResults.db.connected ? '正常' : '异常');
        if (__VLS_ctx.envResults.db.error) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "error-message" },
            });
            (__VLS_ctx.envResults.db.error);
        }
    }
    if (__VLS_ctx.envResults.resources) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "result-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.envResults.resources.cpu);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.envResults.resources.memory);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.envResults.resources.disk);
    }
}
const __VLS_0 = {}.VanCellGroup;
/** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    inset: true,
}));
const __VLS_2 = __VLS_1({
    inset: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
const __VLS_4 = {}.VanCell;
/** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    title: "环境检测",
}));
const __VLS_6 = __VLS_5({
    title: "环境检测",
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
{
    const { 'right-icon': __VLS_thisSlot } = __VLS_7.slots;
    const __VLS_8 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        ...{ 'onClick': {} },
        size: "small",
        type: "primary",
    }));
    const __VLS_10 = __VLS_9({
        ...{ 'onClick': {} },
        size: "small",
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    let __VLS_12;
    let __VLS_13;
    let __VLS_14;
    const __VLS_15 = {
        onClick: (__VLS_ctx.testEnvironment)
    };
    __VLS_11.slots.default;
    var __VLS_11;
}
var __VLS_7;
const __VLS_16 = {}.VanCell;
/** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    title: "数据库连接",
}));
const __VLS_18 = __VLS_17({
    title: "数据库连接",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
{
    const { 'right-icon': __VLS_thisSlot } = __VLS_19.slots;
    const __VLS_20 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        ...{ 'onClick': {} },
        size: "small",
        type: "primary",
    }));
    const __VLS_22 = __VLS_21({
        ...{ 'onClick': {} },
        size: "small",
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    let __VLS_24;
    let __VLS_25;
    let __VLS_26;
    const __VLS_27 = {
        onClick: (__VLS_ctx.testDatabase)
    };
    __VLS_23.slots.default;
    var __VLS_23;
}
var __VLS_19;
const __VLS_28 = {}.VanCell;
/** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    title: "PWA功能",
}));
const __VLS_30 = __VLS_29({
    title: "PWA功能",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
{
    const { 'right-icon': __VLS_thisSlot } = __VLS_31.slots;
    const __VLS_32 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        ...{ 'onClick': {} },
        size: "small",
        type: "primary",
    }));
    const __VLS_34 = __VLS_33({
        ...{ 'onClick': {} },
        size: "small",
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    let __VLS_36;
    let __VLS_37;
    let __VLS_38;
    const __VLS_39 = {
        onClick: (__VLS_ctx.testPWA)
    };
    __VLS_35.slots.default;
    var __VLS_35;
}
var __VLS_31;
const __VLS_40 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    modelValue: (__VLS_ctx.testMessage),
    label: "测试消息",
    placeholder: "输入测试消息",
    autosize: ({ minHeight: 60 }),
    type: "textarea",
}));
const __VLS_42 = __VLS_41({
    modelValue: (__VLS_ctx.testMessage),
    label: "测试消息",
    placeholder: "输入测试消息",
    autosize: ({ minHeight: 60 }),
    type: "textarea",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
const __VLS_44 = {}.VanRadioGroup;
/** @type {[typeof __VLS_components.VanRadioGroup, typeof __VLS_components.vanRadioGroup, typeof __VLS_components.VanRadioGroup, typeof __VLS_components.vanRadioGroup, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    modelValue: (__VLS_ctx.messageType),
    direction: "horizontal",
}));
const __VLS_46 = __VLS_45({
    modelValue: (__VLS_ctx.messageType),
    direction: "horizontal",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
const __VLS_48 = {}.VanRadio;
/** @type {[typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    name: "note",
}));
const __VLS_50 = __VLS_49({
    name: "note",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
var __VLS_51;
const __VLS_52 = {}.VanRadio;
/** @type {[typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    name: "chat",
}));
const __VLS_54 = __VLS_53({
    name: "chat",
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
var __VLS_55;
const __VLS_56 = {}.VanRadio;
/** @type {[typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    name: "llm",
}));
const __VLS_58 = __VLS_57({
    name: "llm",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
var __VLS_59;
var __VLS_47;
const __VLS_60 = {}.VanCellGroup;
/** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({}));
const __VLS_62 = __VLS_61({}, ...__VLS_functionalComponentArgsRest(__VLS_61));
__VLS_63.slots.default;
const __VLS_64 = {}.VanCell;
/** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    title: "测试类型",
}));
const __VLS_66 = __VLS_65({
    title: "测试类型",
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
__VLS_67.slots.default;
{
    const { 'right-icon': __VLS_thisSlot } = __VLS_67.slots;
    const __VLS_68 = {}.VanDropdownMenu;
    /** @type {[typeof __VLS_components.VanDropdownMenu, typeof __VLS_components.vanDropdownMenu, typeof __VLS_components.VanDropdownMenu, typeof __VLS_components.vanDropdownMenu, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({}));
    const __VLS_70 = __VLS_69({}, ...__VLS_functionalComponentArgsRest(__VLS_69));
    __VLS_71.slots.default;
    const __VLS_72 = {}.VanDropdownItem;
    /** @type {[typeof __VLS_components.VanDropdownItem, typeof __VLS_components.vanDropdownItem, ]} */ ;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
        modelValue: (__VLS_ctx.testType),
        options: (__VLS_ctx.testTypeOptions),
    }));
    const __VLS_74 = __VLS_73({
        modelValue: (__VLS_ctx.testType),
        options: (__VLS_ctx.testTypeOptions),
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    var __VLS_71;
}
var __VLS_67;
const __VLS_76 = {}.VanCell;
/** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    title: "模拟错误",
}));
const __VLS_78 = __VLS_77({
    title: "模拟错误",
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
{
    const { 'right-icon': __VLS_thisSlot } = __VLS_79.slots;
    const __VLS_80 = {}.VanSwitch;
    /** @type {[typeof __VLS_components.VanSwitch, typeof __VLS_components.vanSwitch, ]} */ ;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
        modelValue: (__VLS_ctx.simulateError),
        size: "24",
    }));
    const __VLS_82 = __VLS_81({
        modelValue: (__VLS_ctx.simulateError),
        size: "24",
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
}
var __VLS_79;
const __VLS_84 = {}.VanCell;
/** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    title: "模拟延迟(ms)",
}));
const __VLS_86 = __VLS_85({
    title: "模拟延迟(ms)",
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
__VLS_87.slots.default;
{
    const { 'right-icon': __VLS_thisSlot } = __VLS_87.slots;
    const __VLS_88 = {}.VanStepper;
    /** @type {[typeof __VLS_components.VanStepper, typeof __VLS_components.vanStepper, ]} */ ;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        modelValue: (__VLS_ctx.simulateDelay),
        step: "500",
        min: "0",
        max: "5000",
    }));
    const __VLS_90 = __VLS_89({
        modelValue: (__VLS_ctx.simulateDelay),
        step: "500",
        min: "0",
        max: "5000",
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
}
var __VLS_87;
var __VLS_63;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "button-group" },
});
const __VLS_92 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
    ...{ 'onClick': {} },
    type: "primary",
    size: "small",
    loading: (__VLS_ctx.sending),
}));
const __VLS_94 = __VLS_93({
    ...{ 'onClick': {} },
    type: "primary",
    size: "small",
    loading: (__VLS_ctx.sending),
}, ...__VLS_functionalComponentArgsRest(__VLS_93));
let __VLS_96;
let __VLS_97;
let __VLS_98;
const __VLS_99 = {
    onClick: (__VLS_ctx.testSendMessage)
};
__VLS_95.slots.default;
var __VLS_95;
const __VLS_100 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
    ...{ 'onClick': {} },
    type: "info",
    size: "small",
    loading: (__VLS_ctx.loading),
}));
const __VLS_102 = __VLS_101({
    ...{ 'onClick': {} },
    type: "info",
    size: "small",
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_101));
let __VLS_104;
let __VLS_105;
let __VLS_106;
const __VLS_107 = {
    onClick: (__VLS_ctx.testConnection)
};
__VLS_103.slots.default;
var __VLS_103;
const __VLS_108 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
    ...{ 'onClick': {} },
    type: "warning",
    size: "small",
    loading: (__VLS_ctx.streamTesting),
}));
const __VLS_110 = __VLS_109({
    ...{ 'onClick': {} },
    type: "warning",
    size: "small",
    loading: (__VLS_ctx.streamTesting),
}, ...__VLS_functionalComponentArgsRest(__VLS_109));
let __VLS_112;
let __VLS_113;
let __VLS_114;
const __VLS_115 = {
    onClick: (__VLS_ctx.testStreamResponse)
};
__VLS_111.slots.default;
var __VLS_111;
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "test-result" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "status" },
    ...{ class: (__VLS_ctx.status) },
});
(__VLS_ctx.statusText);
if (__VLS_ctx.responseData) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "response-data" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "data-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({});
    (__VLS_ctx.formatJson(__VLS_ctx.responseData));
}
if (__VLS_ctx.streamContent) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stream-response" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stream-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "content" },
    });
    (__VLS_ctx.streamContent);
    if (__VLS_ctx.streamProgress) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "progress" },
        });
        const __VLS_116 = {}.VanProgress;
        /** @type {[typeof __VLS_components.VanProgress, typeof __VLS_components.vanProgress, ]} */ ;
        // @ts-ignore
        const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
            percentage: (__VLS_ctx.streamProgress),
        }));
        const __VLS_118 = __VLS_117({
            percentage: (__VLS_ctx.streamProgress),
        }, ...__VLS_functionalComponentArgsRest(__VLS_117));
    }
}
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "error-info" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "error-card" },
    });
    (__VLS_ctx.error);
}
if (__VLS_ctx.envTestResults.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "test-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "env-results" },
    });
    for (const [result, index] of __VLS_getVForSourceType((__VLS_ctx.envTestResults))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (index),
            ...{ class: (['result-item', result.status]) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "label" },
        });
        (result.label);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "value" },
        });
        (result.value);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "status" },
        });
        (result.statusText);
    }
}
/** @type {__VLS_StyleScopedClasses['communication-test']} */ ;
/** @type {__VLS_StyleScopedClasses['test-section']} */ ;
/** @type {__VLS_StyleScopedClasses['test-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
/** @type {__VLS_StyleScopedClasses['test-results']} */ ;
/** @type {__VLS_StyleScopedClasses['result-item']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['result-item']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['result-item']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['result-item']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['result-item']} */ ;
/** @type {__VLS_StyleScopedClasses['button-group']} */ ;
/** @type {__VLS_StyleScopedClasses['test-result']} */ ;
/** @type {__VLS_StyleScopedClasses['status']} */ ;
/** @type {__VLS_StyleScopedClasses['response-data']} */ ;
/** @type {__VLS_StyleScopedClasses['data-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stream-response']} */ ;
/** @type {__VLS_StyleScopedClasses['stream-card']} */ ;
/** @type {__VLS_StyleScopedClasses['content']} */ ;
/** @type {__VLS_StyleScopedClasses['progress']} */ ;
/** @type {__VLS_StyleScopedClasses['error-info']} */ ;
/** @type {__VLS_StyleScopedClasses['error-card']} */ ;
/** @type {__VLS_StyleScopedClasses['test-section']} */ ;
/** @type {__VLS_StyleScopedClasses['env-results']} */ ;
/** @type {__VLS_StyleScopedClasses['result-item']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['value']} */ ;
/** @type {__VLS_StyleScopedClasses['status']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            testMessage: testMessage,
            messageType: messageType,
            sending: sending,
            loading: loading,
            streamTesting: streamTesting,
            status: status,
            statusText: statusText,
            responseData: responseData,
            error: error,
            streamContent: streamContent,
            streamProgress: streamProgress,
            testType: testType,
            simulateError: simulateError,
            simulateDelay: simulateDelay,
            testTypeOptions: testTypeOptions,
            envTestResults: envTestResults,
            envResults: envResults,
            formatJson: formatJson,
            testSendMessage: testSendMessage,
            testConnection: testConnection,
            testStreamResponse: testStreamResponse,
            testEnvironment: testEnvironment,
            testDatabase: testDatabase,
            testPWA: testPWA,
            testNodeVersion: testNodeVersion,
            testPackageManager: testPackageManager,
            testNetwork: testNetwork,
            testDatabaseConnection: testDatabaseConnection,
            testResources: testResources,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
