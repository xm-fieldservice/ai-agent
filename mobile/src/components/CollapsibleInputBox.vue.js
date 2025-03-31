/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, watch, nextTick } from 'vue';
const props = defineProps();
const emit = defineEmits();
const isExpanded = ref(props.expanded || false);
const inputText = ref('');
const textareaRef = ref(null);
// 计算属性
const inputTypeLabel = computed(() => {
    switch (props.type) {
        case 'chat':
            return '聊天输入';
        case 'note':
            return '笔记输入';
        case 'llm':
            return 'AI 输入';
        default:
            return '文本输入';
    }
});
const canSend = computed(() => {
    return inputText.value.trim().length > 0;
});
// 方法
function toggleExpand() {
    if (props.disabled)
        return;
    if (isExpanded.value) {
        collapse();
    }
    else {
        expand();
    }
}
function expand() {
    if (props.disabled)
        return;
    isExpanded.value = true;
    emit('expand');
    nextTick(() => {
        if (textareaRef.value) {
            textareaRef.value.focus();
        }
    });
}
function collapse() {
    isExpanded.value = false;
    emit('collapse');
}
function handleInput(event) {
    const textarea = event.target;
    // 自动调整高度
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
}
function handleEnter(event) {
    if (event.shiftKey) {
        // Shift + Enter 允许换行
        return;
    }
    handleSend();
}
function handleSend() {
    if (!canSend.value || props.disabled)
        return;
    const text = inputText.value.trim();
    emit('send', text);
    // 清空输入
    inputText.value = '';
    // 重置高度
    if (textareaRef.value) {
        textareaRef.value.style.height = 'auto';
    }
}
function handleActionClick(action) {
    if (props.disabled)
        return;
    emit('action-click', action);
}
// 重置输入框
function reset() {
    inputText.value = '';
    if (textareaRef.value) {
        textareaRef.value.style.height = 'auto';
    }
}
// 监听展开状态变化
watch(() => props.expanded, (newValue) => {
    isExpanded.value = newValue || false;
});
// 展开过渡
function startExpandTransition(el, done) {
    const element = el;
    element.style.height = '0';
    element.style.opacity = '0';
    requestAnimationFrame(() => {
        element.style.height = `${element.scrollHeight}px`;
        element.style.opacity = '1';
        element.addEventListener('transitionend', function handler() {
            element.style.height = 'auto';
            element.removeEventListener('transitionend', handler);
            done();
        });
    });
}
// 收起过渡
function startCollapseTransition(el, done) {
    const element = el;
    element.style.height = `${element.scrollHeight}px`;
    element.style.opacity = '1';
    requestAnimationFrame(() => {
        element.style.height = '0';
        element.style.opacity = '0';
        element.addEventListener('transitionend', function handler() {
            element.removeEventListener('transitionend', handler);
            done();
        });
    });
}
// 暴露方法给父组件
const __VLS_exposed = {
    reset,
    expand,
    collapse
};
defineExpose(__VLS_exposed);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
__VLS_ctx.props.minExpandedHeight + "px";
__VLS_ctx.props.maxExpandedHeight + "px";
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "collapsible-input-box" },
    ...{ class: ({ 'expanded': __VLS_ctx.isExpanded, 'collapsed': !__VLS_ctx.isExpanded }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.toggleExpand) },
    ...{ class: "input-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "current-type" },
});
(__VLS_ctx.currentTypeLabel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "toggle-button" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    ...{ class: "toggle-icon" },
    viewBox: "0 0 24 24",
    ...{ style: ({ transform: __VLS_ctx.isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
});
const __VLS_0 = {}.transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.transition, typeof __VLS_components.Transition, typeof __VLS_components.transition, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onEnter': {} },
    ...{ 'onLeave': {} },
    name: "expand",
    persisted: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onEnter': {} },
    ...{ 'onLeave': {} },
    name: "expand",
    persisted: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onEnter: (__VLS_ctx.startExpandTransition)
};
const __VLS_8 = {
    onLeave: (__VLS_ctx.startCollapseTransition)
};
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "input-content" },
});
__VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.isExpanded) }, null, null);
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    ...{ onInput: (__VLS_ctx.onInput) },
    ...{ onKeydown: (__VLS_ctx.onEnterPress) },
    ref: "textareaRef",
    value: (__VLS_ctx.inputText),
    placeholder: (__VLS_ctx.placeholder),
    ...{ class: "input-textarea" },
});
/** @type {typeof __VLS_ctx.textareaRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "input-actions" },
});
const __VLS_9 = {}.TransitionGroup;
/** @type {[typeof __VLS_components.TransitionGroup, typeof __VLS_components.transitionGroup, typeof __VLS_components.TransitionGroup, typeof __VLS_components.transitionGroup, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    name: "fade",
    tag: "div",
    ...{ class: "action-buttons" },
}));
const __VLS_11 = __VLS_10({
    name: "fade",
    tag: "div",
    ...{ class: "action-buttons" },
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
__VLS_12.slots.default;
for (const [action] of __VLS_getVForSourceType((__VLS_ctx.inputActions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.onActionClick(action);
            } },
        key: (action.id),
        ...{ class: "action-button" },
    });
    if (action.iconComponent) {
        const __VLS_13 = ((action.iconComponent));
        // @ts-ignore
        const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({}));
        const __VLS_15 = __VLS_14({}, ...__VLS_functionalComponentArgsRest(__VLS_14));
    }
    else if (action.icon) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "action-icon" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img, __VLS_intrinsicElements.img)({
            src: (action.icon),
            alt: (action.label),
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "action-label" },
        });
        (action.label);
    }
}
var __VLS_12;
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.sendMessage) },
    ...{ class: "send-button" },
    disabled: (!__VLS_ctx.canSend),
});
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['collapsible-input-box']} */ ;
/** @type {__VLS_StyleScopedClasses['expanded']} */ ;
/** @type {__VLS_StyleScopedClasses['collapsed']} */ ;
/** @type {__VLS_StyleScopedClasses['input-header']} */ ;
/** @type {__VLS_StyleScopedClasses['current-type']} */ ;
/** @type {__VLS_StyleScopedClasses['toggle-button']} */ ;
/** @type {__VLS_StyleScopedClasses['toggle-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['input-content']} */ ;
/** @type {__VLS_StyleScopedClasses['input-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['input-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button']} */ ;
/** @type {__VLS_StyleScopedClasses['action-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['action-label']} */ ;
/** @type {__VLS_StyleScopedClasses['send-button']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            props: props,
            isExpanded: isExpanded,
            inputText: inputText,
            textareaRef: textareaRef,
            canSend: canSend,
            toggleExpand: toggleExpand,
            startExpandTransition: startExpandTransition,
            startCollapseTransition: startCollapseTransition,
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
