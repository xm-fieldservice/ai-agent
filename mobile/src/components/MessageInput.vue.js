/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed } from 'vue';
import { NotesO, ChatO, QuestionO } from '@vant/icons';
// 输入类型定义
const inputTypes = [
    { id: 'note', name: '笔记', icon: NotesO },
    { id: 'chat', name: '聊天', icon: ChatO },
    { id: 'llm', name: 'LLM问答', icon: QuestionO }
];
// 响应式状态
const currentType = ref('note');
const inputText = ref('');
const inputRef = ref(null);
// 计算属性：根据类型显示不同的占位符
const placeholder = computed(() => {
    const placeholders = {
        note: '输入笔记内容...',
        chat: '输入聊天内容...',
        llm: '输入问题...'
    };
    return placeholders[currentType.value];
});
// 方法定义
const switchType = (type) => {
    currentType.value = type;
};
const autoResize = () => {
    const textarea = inputRef.value;
    if (!textarea)
        return;
    // 重置高度
    textarea.style.height = 'auto';
    // 设置新高度
    const newHeight = Math.min(textarea.scrollHeight, 150); // 最大高度150px
    textarea.style.height = `${newHeight}px`;
};
const handleEnter = (e) => {
    if (e.shiftKey) {
        // Shift+Enter 换行
        return;
    }
    handleSend();
};
const handleSend = () => {
    if (!inputText.value.trim())
        return;
    // 发送消息
    const message = {
        type: currentType.value,
        content: inputText.value,
        timestamp: Date.now()
    };
    // 触发发送事件
    emit('send', message);
    // 清空输入
    inputText.value = '';
    // 重置输入框高度
    if (inputRef.value) {
        inputRef.value.style.height = 'auto';
    }
};
// 定义组件事件
const emit = defineEmits(['send']);
const props = defineProps({
    disabled: {
        type: Boolean,
        default: false
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled']} */ ;
/** @type {__VLS_StyleScopedClasses['message-input']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "message-input" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "input-types" },
});
for (const [type] of __VLS_getVForSourceType((__VLS_ctx.inputTypes))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                !props.disabled && __VLS_ctx.switchType(type.id);
            } },
        key: (type.id),
        ...{ class: (['type-item', {
                    active: __VLS_ctx.currentType === type.id,
                    disabled: props.disabled
                }]) },
    });
    const __VLS_0 = ((type.icon));
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
    const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (type.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "input-area" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    ...{ onInput: (__VLS_ctx.autoResize) },
    ...{ onKeydown: (__VLS_ctx.handleEnter) },
    ref: "inputRef",
    value: (__VLS_ctx.inputText),
    placeholder: (__VLS_ctx.placeholder),
    disabled: (props.disabled),
    rows: (1),
});
/** @type {typeof __VLS_ctx.inputRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.handleSend) },
    ...{ class: "send-btn" },
    ...{ class: ({
            active: __VLS_ctx.inputText.trim() && !props.disabled,
            disabled: props.disabled
        }) },
    disabled: (props.disabled || !__VLS_ctx.inputText.trim()),
});
/** @type {__VLS_StyleScopedClasses['message-input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-types']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled']} */ ;
/** @type {__VLS_StyleScopedClasses['type-item']} */ ;
/** @type {__VLS_StyleScopedClasses['input-area']} */ ;
/** @type {__VLS_StyleScopedClasses['send-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            $props: __VLS_makeOptional(props),
            ...props,
            $emit: emit,
            inputTypes: inputTypes,
            currentType: currentType,
            inputText: inputText,
            inputRef: inputRef,
            placeholder: placeholder,
            switchType: switchType,
            autoResize: autoResize,
            handleEnter: handleEnter,
            handleSend: handleSend,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {
            $props: __VLS_makeOptional(props),
            ...props,
            $emit: emit,
        };
    },
});
; /* PartiallyEnd: #4569/main.vue */
