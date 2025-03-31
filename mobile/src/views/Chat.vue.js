/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted, nextTick, watch } from 'vue';
import { useModelStore } from '../stores/model';
import { useChatStore } from '../stores/chat';
import Header from '../components/Header.vue';
import MarkdownIt from 'markdown-it';
import MessageList from '@/components/MessageList.vue';
import MessageInput from '@/components/MessageInput.vue';
import { publicNotes, chat, llm } from '@/api';
import { Toast } from 'vant';
const md = new MarkdownIt();
const messageList = ref(null);
const inputText = ref('');
const loading = ref(false);
const loadingMore = ref(false);
const hasMoreMessages = ref(true);
const error = ref(null);
const messageContainer = ref(null);
const currentPage = ref(1);
const pageSize = ref(20);
const modelStore = useModelStore();
const chatStore = useChatStore();
const { messages } = chatStore;
const renderMessage = (content) => {
    return md.render(content);
};
const scrollToBottom = async () => {
    await nextTick();
    if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
};
const handleSend = async (message) => {
    try {
        loading.value = true;
        // 添加用户消息到列表
        messages.value.push(message);
        await scrollToBottom();
        // 根据消息类型处理
        let response;
        if (message.type === 'note') {
            // 保存到公共笔记
            response = await publicNotes.add(message.content);
            Toast.success('笔记已保存');
        }
        else if (message.type === 'llm') {
            // 发送到LLM并等待回复
            response = await llm.ask(message.content);
            // 添加LLM回复到消息列表
            messages.value.push({
                type: 'llm',
                content: response.text,
                timestamp: Date.now()
            });
            await scrollToBottom();
        }
        else {
            // 普通聊天消息
            response = await chat.send(message);
        }
    }
    catch (error) {
        Toast.fail(error.message || '发送失败');
    }
    finally {
        loading.value = false;
    }
};
const toggleMenu = () => {
    // TODO: 实现菜单切换
};
const togglePhone = () => {
    // TODO: 实现语音功能
};
// 加载历史消息
const loadHistory = async () => {
    try {
        if (loadingMore.value)
            return;
        loadingMore.value = true;
        // 分页加载历史消息
        const history = await chat.getHistory({
            page: currentPage.value,
            pageSize: pageSize.value
        });
        if (history && history.length > 0) {
            // 将历史消息添加到消息列表顶部
            messages.value = [...history, ...messages.value];
            currentPage.value++;
        }
        else {
            // 没有更多历史消息
            hasMoreMessages.value = false;
        }
    }
    catch (error) {
        Toast.fail('加载历史消息失败');
    }
    finally {
        loadingMore.value = false;
    }
};
// 监听错误状态显示提示
watch(error, (newError) => {
    if (newError) {
        // 使用 Vant 的 Toast 显示错误信息
        Toast.fail(newError);
    }
});
onMounted(() => {
    // 初始加载历史消息
    loadHistory();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['message-content']} */ ;
/** @type {__VLS_StyleScopedClasses['message-content']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chat-page" },
});
/** @type {[typeof Header, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(Header, new Header({
    ...{ 'onToggleMenu': {} },
    ...{ 'onTogglePhone': {} },
}));
const __VLS_1 = __VLS_0({
    ...{ 'onToggleMenu': {} },
    ...{ 'onTogglePhone': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    onToggleMenu: (__VLS_ctx.toggleMenu)
};
const __VLS_7 = {
    onTogglePhone: (__VLS_ctx.togglePhone)
};
var __VLS_2;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chat-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "message-container" },
    ref: "messageContainer",
});
/** @type {typeof __VLS_ctx.messageContainer} */ ;
/** @type {[typeof MessageList, ]} */ ;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent(MessageList, new MessageList({
    ...{ 'onLoadMore': {} },
    messages: (__VLS_ctx.messages),
    loading: (__VLS_ctx.loading),
    loadingMore: (__VLS_ctx.loadingMore),
    hasMore: (__VLS_ctx.hasMoreMessages),
}));
const __VLS_9 = __VLS_8({
    ...{ 'onLoadMore': {} },
    messages: (__VLS_ctx.messages),
    loading: (__VLS_ctx.loading),
    loadingMore: (__VLS_ctx.loadingMore),
    hasMore: (__VLS_ctx.hasMoreMessages),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
let __VLS_11;
let __VLS_12;
let __VLS_13;
const __VLS_14 = {
    onLoadMore: (__VLS_ctx.loadHistory)
};
var __VLS_10;
/** @type {[typeof MessageInput, ]} */ ;
// @ts-ignore
const __VLS_15 = __VLS_asFunctionalComponent(MessageInput, new MessageInput({
    ...{ 'onSend': {} },
    disabled: (__VLS_ctx.loading),
}));
const __VLS_16 = __VLS_15({
    ...{ 'onSend': {} },
    disabled: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_15));
let __VLS_18;
let __VLS_19;
let __VLS_20;
const __VLS_21 = {
    onSend: (__VLS_ctx.handleSend)
};
var __VLS_17;
/** @type {__VLS_StyleScopedClasses['chat-page']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-container']} */ ;
/** @type {__VLS_StyleScopedClasses['message-container']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Header: Header,
            MessageList: MessageList,
            MessageInput: MessageInput,
            loading: loading,
            loadingMore: loadingMore,
            hasMoreMessages: hasMoreMessages,
            messageContainer: messageContainer,
            messages: messages,
            handleSend: handleSend,
            toggleMenu: toggleMenu,
            togglePhone: togglePhone,
            loadHistory: loadHistory,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
