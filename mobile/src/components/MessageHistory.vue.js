/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted, watch } from 'vue';
import { RecycleScroller } from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import { featureService } from '../services/feature-service';
import { storageService } from '../services/storage-service';
import LazyMedia from './LazyMedia.vue';
const props = defineProps();
const emit = defineEmits();
const messages = ref([]);
const loading = ref(false);
const loadingMore = ref(false);
const error = ref(null);
const historyRef = ref(null);
const messageOffset = ref(0);
const messagesPerPage = 20;
const hasMoreMessages = ref(false);
const visibleItems = ref([]);
// 估算消息高度
function estimateMessageHeight(message) {
    // 基础高度（包含padding、margin等）
    const baseHeight = 60;
    // 每行文字高度（假设每行20个字符）
    const lineHeight = 24;
    const linesCount = Math.ceil(message.content.length / 20);
    return baseHeight + (lineHeight * linesCount);
}
// 处理可见项变化
function handleVisibleItems(items) {
    visibleItems.value = items;
    // 如果滚动到底部附近，自动加载更多
    const lastVisibleIndex = items[items.length - 1]?.index;
    if (lastVisibleIndex && lastVisibleIndex >= messages.value.length - 5) {
        if (hasMoreMessages.value && !loadingMore.value) {
            loadMoreMessages();
        }
    }
}
// 格式化时间
function formatTime(timestamp) {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}
// 重新加载消息
async function retryLoading() {
    error.value = null;
    messageOffset.value = 0;
    await loadMessages();
}
// 加载更多消息
async function loadMoreMessages() {
    if (loadingMore.value)
        return;
    loadingMore.value = true;
    try {
        messageOffset.value += messagesPerPage;
        const olderMessages = await storageService.getMessagesByFeaturePaginated(props.featureId, messagesPerPage, messageOffset.value);
        if (olderMessages.length > 0) {
            messages.value = [...messages.value, ...olderMessages];
            hasMoreMessages.value = olderMessages.length === messagesPerPage;
        }
        else {
            hasMoreMessages.value = false;
        }
    }
    catch (err) {
        console.error('加载更多消息失败:', err);
    }
    finally {
        loadingMore.value = false;
    }
}
// 重发消息
async function resendMessage(message) {
    try {
        // 标记为发送中
        await storageService.updateMessage(message.id, { status: 'pending' });
        const messageIndex = messages.value.findIndex(m => m.id === message.id);
        if (messageIndex !== -1) {
            messages.value[messageIndex] = { ...messages.value[messageIndex], status: 'pending' };
        }
        // 重发消息
        await featureService.sendFeatureMessage(props.featureId, message.content);
        // 更新状态为成功
        await storageService.updateMessage(message.id, { status: 'sent', error: undefined });
        if (messageIndex !== -1) {
            messages.value[messageIndex] = {
                ...messages.value[messageIndex],
                status: 'sent',
                error: undefined
            };
        }
    }
    catch (err) {
        console.error('重发消息失败:', err);
        // 更新状态为失败
        const error = err instanceof Error ? err.message : '发送失败';
        await storageService.updateMessage(message.id, {
            status: 'failed',
            error
        });
        const messageIndex = messages.value.findIndex(m => m.id === message.id);
        if (messageIndex !== -1) {
            messages.value[messageIndex] = {
                ...messages.value[messageIndex],
                status: 'failed',
                error
            };
        }
        emit('retry', message);
    }
}
// 加载消息历史
async function loadMessages() {
    loading.value = true;
    error.value = null;
    messageOffset.value = 0;
    try {
        await storageService.initialize();
        // 从存储中加载消息
        const storedMessages = await storageService.getMessagesByFeaturePaginated(props.featureId, messagesPerPage, 0);
        messages.value = storedMessages;
        hasMoreMessages.value = storedMessages.length === messagesPerPage;
        // 更新功能访问记录
        const feature = featureService.getFeatureById(props.featureId);
        if (feature) {
            await storageService.updateFeatureAccess(props.featureId, feature.name);
        }
    }
    catch (err) {
        console.error('加载消息失败:', err);
        error.value = '加载消息失败，请重试';
    }
    finally {
        loading.value = false;
    }
}
// 滚动到底部
function scrollToBottom() {
    if (historyRef.value) {
        historyRef.value.scrollTo({
            top: historyRef.value.scrollHeight,
            behavior: 'smooth'
        });
    }
}
// 添加新消息
async function addMessage(message) {
    // 保存到存储
    await storageService.addMessage(message);
    // 添加到UI
    messages.value.unshift(message);
    // 下一个事件循环滚动到底部
    setTimeout(scrollToBottom, 0);
}
// 更新消息状态
async function updateMessageStatus(messageId, status, errorMessage) {
    // 更新存储
    await storageService.updateMessage(messageId, {
        status,
        error: errorMessage
    });
    // 更新UI
    const index = messages.value.findIndex(m => m.id === messageId);
    if (index !== -1) {
        messages.value[index] = {
            ...messages.value[index],
            status,
            error: errorMessage
        };
    }
}
// 监听功能ID变化
watch(() => props.featureId, () => {
    loadMessages();
});
// 组件挂载时加载消息
onMounted(() => {
    loadMessages();
});
// 暴露方法给父组件
const __VLS_exposed = {
    addMessage,
    updateMessageStatus,
    scrollToBottom
};
defineExpose(__VLS_exposed);
// 处理媒体加载错误
function handleMediaError(message) {
    console.error('媒体加载失败:', message);
    // 可以在这里添加错误处理逻辑，比如显示错误提示或重试加载
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['message-content']} */ ;
/** @type {__VLS_StyleScopedClasses['message-content']} */ ;
/** @type {__VLS_StyleScopedClasses['message-content']} */ ;
/** @type {__VLS_StyleScopedClasses['load-more-button']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "message-history" },
    ref: "historyRef",
});
/** @type {typeof __VLS_ctx.historyRef} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading-state" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading-spinner" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "error-state" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "error-message" },
    });
    (__VLS_ctx.error);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.retryLoading) },
        ...{ class: "retry-button" },
    });
}
else {
    if (__VLS_ctx.messages.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-state" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    else {
        const __VLS_0 = {}.RecycleScroller;
        /** @type {[typeof __VLS_components.RecycleScroller, typeof __VLS_components.RecycleScroller, ]} */ ;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
            ...{ 'onVisible': {} },
            ...{ class: "message-list" },
            items: (__VLS_ctx.messages),
            itemSize: (__VLS_ctx.estimateMessageHeight),
            keyField: "id",
        }));
        const __VLS_2 = __VLS_1({
            ...{ 'onVisible': {} },
            ...{ class: "message-list" },
            items: (__VLS_ctx.messages),
            itemSize: (__VLS_ctx.estimateMessageHeight),
            keyField: "id",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        let __VLS_4;
        let __VLS_5;
        let __VLS_6;
        const __VLS_7 = {
            onVisible: (__VLS_ctx.handleVisibleItems)
        };
        {
            const { default: __VLS_thisSlot } = __VLS_3.slots;
            const { item: message } = __VLS_getSlotParam(__VLS_thisSlot);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "message-item" },
                ...{ class: ([
                        message.source === 'mobile' ? 'sent' : 'received',
                        { 'status-failed': message.status === 'failed' },
                        'animate-message'
                    ]) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "message-content" },
            });
            if (message.type === 'text') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "message-text" },
                });
                (message.content);
            }
            else {
                /** @type {[typeof LazyMedia, ]} */ ;
                // @ts-ignore
                const __VLS_8 = __VLS_asFunctionalComponent(LazyMedia, new LazyMedia({
                    ...{ 'onError': {} },
                    url: (message.type === 'file' ? message.file?.url : message.media?.url),
                    type: (message.type),
                    thumbnailUrl: (message.media?.thumbnailUrl),
                    width: (message.media?.width),
                    height: (message.media?.height),
                    mediaType: (message.media?.type),
                    fileName: (message.file?.name),
                    fileSize: (message.file?.size),
                    ...{ class: "message-media" },
                }));
                const __VLS_9 = __VLS_8({
                    ...{ 'onError': {} },
                    url: (message.type === 'file' ? message.file?.url : message.media?.url),
                    type: (message.type),
                    thumbnailUrl: (message.media?.thumbnailUrl),
                    width: (message.media?.width),
                    height: (message.media?.height),
                    mediaType: (message.media?.type),
                    fileName: (message.file?.name),
                    fileSize: (message.file?.size),
                    ...{ class: "message-media" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_8));
                let __VLS_11;
                let __VLS_12;
                let __VLS_13;
                const __VLS_14 = {
                    onError: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!!(__VLS_ctx.messages.length === 0))
                            return;
                        if (!!(message.type === 'text'))
                            return;
                        __VLS_ctx.handleMediaError(message);
                    }
                };
                var __VLS_10;
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "message-meta" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "message-time" },
            });
            (__VLS_ctx.formatTime(message.timestamp));
            const __VLS_15 = {}.transition;
            /** @type {[typeof __VLS_components.Transition, typeof __VLS_components.transition, typeof __VLS_components.Transition, typeof __VLS_components.transition, ]} */ ;
            // @ts-ignore
            const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
                name: "fade",
            }));
            const __VLS_17 = __VLS_16({
                name: "fade",
            }, ...__VLS_functionalComponentArgsRest(__VLS_16));
            __VLS_18.slots.default;
            if (message.status === 'failed') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "message-error" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.error))
                                return;
                            if (!!(__VLS_ctx.messages.length === 0))
                                return;
                            if (!(message.status === 'failed'))
                                return;
                            __VLS_ctx.resendMessage(message);
                        } },
                    ...{ class: "resend-button" },
                });
            }
            else if (message.status === 'pending') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "message-pending" },
                });
            }
            var __VLS_18;
            __VLS_3.slots['' /* empty slot name completion */];
        }
        var __VLS_3;
    }
    if (__VLS_ctx.hasMoreMessages) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "load-more" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.loadMoreMessages) },
            disabled: (__VLS_ctx.loadingMore),
            ...{ class: "load-more-button" },
        });
        (__VLS_ctx.loadingMore ? '加载中...' : '加载更多');
    }
}
/** @type {__VLS_StyleScopedClasses['message-history']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-spinner']} */ ;
/** @type {__VLS_StyleScopedClasses['error-state']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['retry-button']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['message-list']} */ ;
/** @type {__VLS_StyleScopedClasses['message-item']} */ ;
/** @type {__VLS_StyleScopedClasses['status-failed']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-message']} */ ;
/** @type {__VLS_StyleScopedClasses['message-content']} */ ;
/** @type {__VLS_StyleScopedClasses['message-text']} */ ;
/** @type {__VLS_StyleScopedClasses['message-media']} */ ;
/** @type {__VLS_StyleScopedClasses['message-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['message-time']} */ ;
/** @type {__VLS_StyleScopedClasses['message-error']} */ ;
/** @type {__VLS_StyleScopedClasses['resend-button']} */ ;
/** @type {__VLS_StyleScopedClasses['message-pending']} */ ;
/** @type {__VLS_StyleScopedClasses['load-more']} */ ;
/** @type {__VLS_StyleScopedClasses['load-more-button']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            RecycleScroller: RecycleScroller,
            LazyMedia: LazyMedia,
            messages: messages,
            loading: loading,
            loadingMore: loadingMore,
            error: error,
            historyRef: historyRef,
            hasMoreMessages: hasMoreMessages,
            estimateMessageHeight: estimateMessageHeight,
            handleVisibleItems: handleVisibleItems,
            formatTime: formatTime,
            retryLoading: retryLoading,
            loadMoreMessages: loadMoreMessages,
            resendMessage: resendMessage,
            handleMediaError: handleMediaError,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {
            ...__VLS_exposed,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
