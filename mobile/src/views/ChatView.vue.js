/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, onMounted, onUnmounted } from 'vue';
import FeatureSelector from '../components/FeatureSelector.vue';
import MessageHistory from '../components/MessageHistory.vue';
import CollapsibleInputBox from '../components/CollapsibleInputBox.vue';
import { featureService } from '../services/feature-service';
import { storageService } from '../services/storage-service';
// 状态
const availableFeatures = ref([]);
const selectedFeature = ref(null);
const selectedFeatureId = computed(() => selectedFeature.value?.id);
const inputExpanded = ref(false);
const currentInputType = ref('text');
const messageHistoryRef = ref(null);
const inputBoxRef = ref(null);
const isOnline = ref(navigator.onLine);
// 输入框占位符
const getInputPlaceholder = computed(() => {
    if (!selectedFeature.value)
        return '请先选择一个功能';
    if (!isOnline.value)
        return '离线模式 - 消息将在恢复连接后发送';
    return `发送消息给 ${selectedFeature.value.name}`;
});
// 输入框操作按钮
const inputActions = [
    { icon: 'image', tooltip: '发送图片' },
    { icon: 'attachment', tooltip: '发送附件' },
    { icon: 'emoji', tooltip: '选择表情' }
];
// 处理功能选择
async function handleFeatureSelect(feature) {
    selectedFeature.value = feature;
    // 重置输入框状态
    inputExpanded.value = false;
    if (inputBoxRef.value) {
        inputBoxRef.value.reset();
    }
}
// 处理功能加载完成
function handleFeaturesLoaded(features) {
    availableFeatures.value = features;
    // 默认选择第一个功能
    if (features.length > 0 && !selectedFeature.value) {
        handleFeatureSelect(features[0]);
    }
}
// 处理输入框展开/折叠
function handleInputExpand() {
    inputExpanded.value = true;
}
function handleInputCollapse() {
    inputExpanded.value = false;
}
// 处理消息发送
async function handleSendMessage(content) {
    if (!selectedFeature.value)
        return;
    const messageId = Date.now().toString();
    const timestamp = new Date();
    // 创建消息对象
    const message = {
        id: messageId,
        featureId: selectedFeature.value.id,
        content,
        timestamp,
        source: 'mobile',
        status: isOnline.value ? 'pending' : 'failed'
    };
    // 如果不在线，添加错误信息
    if (!isOnline.value) {
        message.error = '设备离线，消息将在恢复连接后发送';
    }
    // 添加消息到历史记录
    if (messageHistoryRef.value) {
        await messageHistoryRef.value.addMessage(message);
    }
    // 如果在线，发送消息
    if (isOnline.value) {
        try {
            await featureService.sendFeatureMessage(selectedFeature.value.id, content);
            // 更新消息状态为已发送
            if (messageHistoryRef.value) {
                await messageHistoryRef.value.updateMessageStatus(messageId, 'sent');
            }
        }
        catch (error) {
            console.error('发送消息失败:', error);
            // 更新消息状态为发送失败
            if (messageHistoryRef.value) {
                const errorMessage = error instanceof Error ? error.message : '发送失败';
                await messageHistoryRef.value.updateMessageStatus(messageId, 'failed', errorMessage);
            }
        }
    }
}
// 处理消息重试
async function handleMessageRetry(message) {
    if (!selectedFeature.value || !isOnline.value)
        return;
    try {
        // 更新状态为发送中
        if (messageHistoryRef.value) {
            await messageHistoryRef.value.updateMessageStatus(message.id, 'pending');
        }
        // 重发消息
        await featureService.sendFeatureMessage(selectedFeature.value.id, message.content);
        // 更新状态为成功
        if (messageHistoryRef.value) {
            await messageHistoryRef.value.updateMessageStatus(message.id, 'sent');
        }
    }
    catch (error) {
        console.error('重发消息失败:', error);
        // 更新状态为失败
        if (messageHistoryRef.value) {
            const errorMessage = error instanceof Error ? error.message : '发送失败';
            await messageHistoryRef.value.updateMessageStatus(message.id, 'failed', errorMessage);
        }
    }
}
// 处理网络状态变化
function handleOnlineStatus() {
    const wasOffline = !isOnline.value;
    isOnline.value = navigator.onLine;
    // 如果从离线变为在线，尝试发送所有失败的消息
    if (wasOffline && isOnline.value) {
        retrySendFailedMessages();
    }
}
// 尝试发送失败的消息
async function retrySendFailedMessages() {
    if (!selectedFeature.value)
        return;
    try {
        // 获取当前功能的所有消息
        const allMessages = await storageService.getMessagesByFeature(selectedFeature.value.id);
        // 筛选出失败的消息
        const failedMessages = allMessages.filter(m => m.status === 'failed');
        // 逐个重发
        for (const message of failedMessages) {
            await handleMessageRetry(message);
        }
    }
    catch (error) {
        console.error('重发失败消息出错:', error);
    }
}
// 处理输入框操作按钮点击
function handleInputAction(action) {
    // TODO: 实现各种操作按钮的功能
    console.log('Input action clicked:', action);
}
// 初始化
onMounted(async () => {
    try {
        // 初始化存储服务
        await storageService.initialize();
        // 初始化功能服务
        await featureService.initialize();
        handleFeaturesLoaded(featureService.getFeatures());
        // 添加网络状态监听
        window.addEventListener('online', handleOnlineStatus);
        window.addEventListener('offline', handleOnlineStatus);
    }
    catch (error) {
        console.error('初始化失败:', error);
        // TODO: 显示错误提示
    }
});
// 清理事件监听
onUnmounted(() => {
    window.removeEventListener('online', handleOnlineStatus);
    window.removeEventListener('offline', handleOnlineStatus);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chat-view" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "feature-container" },
});
/** @type {[typeof FeatureSelector, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(FeatureSelector, new FeatureSelector({
    ...{ 'onFeatureSelected': {} },
    ...{ 'onFeaturesLoaded': {} },
    initialFeatures: (__VLS_ctx.availableFeatures),
    activeFeatureId: (__VLS_ctx.selectedFeatureId),
}));
const __VLS_1 = __VLS_0({
    ...{ 'onFeatureSelected': {} },
    ...{ 'onFeaturesLoaded': {} },
    initialFeatures: (__VLS_ctx.availableFeatures),
    activeFeatureId: (__VLS_ctx.selectedFeatureId),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    onFeatureSelected: (__VLS_ctx.handleFeatureSelect)
};
const __VLS_7 = {
    onFeaturesLoaded: (__VLS_ctx.handleFeaturesLoaded)
};
var __VLS_2;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chat-content" },
});
if (__VLS_ctx.selectedFeature) {
    /** @type {[typeof MessageHistory, ]} */ ;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent(MessageHistory, new MessageHistory({
        ...{ 'onRetry': {} },
        featureId: (__VLS_ctx.selectedFeature.id),
        ref: "messageHistoryRef",
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onRetry': {} },
        featureId: (__VLS_ctx.selectedFeature.id),
        ref: "messageHistoryRef",
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_11;
    let __VLS_12;
    let __VLS_13;
    const __VLS_14 = {
        onRetry: (__VLS_ctx.handleMessageRetry)
    };
    /** @type {typeof __VLS_ctx.messageHistoryRef} */ ;
    var __VLS_15 = {};
    var __VLS_10;
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "no-feature-selected" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "input-container" },
});
/** @type {[typeof CollapsibleInputBox, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(CollapsibleInputBox, new CollapsibleInputBox({
    ...{ 'onExpand': {} },
    ...{ 'onCollapse': {} },
    ...{ 'onSend': {} },
    ...{ 'onActionClick': {} },
    type: (__VLS_ctx.currentInputType),
    expanded: (__VLS_ctx.inputExpanded),
    placeholder: (__VLS_ctx.getInputPlaceholder),
    actionButtons: (__VLS_ctx.inputActions),
    disabled: (!__VLS_ctx.isOnline && !__VLS_ctx.selectedFeature),
    ref: "inputBoxRef",
}));
const __VLS_18 = __VLS_17({
    ...{ 'onExpand': {} },
    ...{ 'onCollapse': {} },
    ...{ 'onSend': {} },
    ...{ 'onActionClick': {} },
    type: (__VLS_ctx.currentInputType),
    expanded: (__VLS_ctx.inputExpanded),
    placeholder: (__VLS_ctx.getInputPlaceholder),
    actionButtons: (__VLS_ctx.inputActions),
    disabled: (!__VLS_ctx.isOnline && !__VLS_ctx.selectedFeature),
    ref: "inputBoxRef",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_20;
let __VLS_21;
let __VLS_22;
const __VLS_23 = {
    onExpand: (__VLS_ctx.handleInputExpand)
};
const __VLS_24 = {
    onCollapse: (__VLS_ctx.handleInputCollapse)
};
const __VLS_25 = {
    onSend: (__VLS_ctx.handleSendMessage)
};
const __VLS_26 = {
    onActionClick: (__VLS_ctx.handleInputAction)
};
/** @type {typeof __VLS_ctx.inputBoxRef} */ ;
var __VLS_27 = {};
var __VLS_19;
if (!__VLS_ctx.isOnline) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "offline-indicator" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
/** @type {__VLS_StyleScopedClasses['chat-view']} */ ;
/** @type {__VLS_StyleScopedClasses['feature-container']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-content']} */ ;
/** @type {__VLS_StyleScopedClasses['no-feature-selected']} */ ;
/** @type {__VLS_StyleScopedClasses['input-container']} */ ;
/** @type {__VLS_StyleScopedClasses['offline-indicator']} */ ;
// @ts-ignore
var __VLS_16 = __VLS_15, __VLS_28 = __VLS_27;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            FeatureSelector: FeatureSelector,
            MessageHistory: MessageHistory,
            CollapsibleInputBox: CollapsibleInputBox,
            availableFeatures: availableFeatures,
            selectedFeature: selectedFeature,
            selectedFeatureId: selectedFeatureId,
            inputExpanded: inputExpanded,
            currentInputType: currentInputType,
            messageHistoryRef: messageHistoryRef,
            inputBoxRef: inputBoxRef,
            isOnline: isOnline,
            getInputPlaceholder: getInputPlaceholder,
            inputActions: inputActions,
            handleFeatureSelect: handleFeatureSelect,
            handleFeaturesLoaded: handleFeaturesLoaded,
            handleInputExpand: handleInputExpand,
            handleInputCollapse: handleInputCollapse,
            handleSendMessage: handleSendMessage,
            handleMessageRetry: handleMessageRetry,
            handleInputAction: handleInputAction,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
