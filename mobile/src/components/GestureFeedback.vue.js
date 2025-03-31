/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const isPulling = ref(false);
const isBackGesture = ref(false);
const pullText = ref('下拉刷新');
// 监听下拉刷新事件
const handlePullToRefresh = () => {
    isPulling.value = true;
    pullText.value = '正在刷新...';
    // 模拟刷新
    setTimeout(() => {
        isPulling.value = false;
        pullText.value = '下拉刷新';
        window.location.reload();
    }, 1500);
};
// 监听返回手势事件
const handleBackGesture = () => {
    isBackGesture.value = true;
    setTimeout(() => {
        isBackGesture.value = false;
        router.back();
    }, 300);
};
onMounted(() => {
    window.addEventListener('pullToRefresh', handlePullToRefresh);
    window.addEventListener('backGesture', handleBackGesture);
});
onUnmounted(() => {
    window.removeEventListener('pullToRefresh', handlePullToRefresh);
    window.removeEventListener('backGesture', handleBackGesture);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
/** @type {__VLS_StyleScopedClasses['van-icon']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "gesture-feedback" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pull-refresh" },
    ...{ class: ({ 'is-active': __VLS_ctx.isPulling }) },
});
if (__VLS_ctx.isPulling) {
    const __VLS_0 = {}.VanLoading;
    /** @type {[typeof __VLS_components.VanLoading, typeof __VLS_components.vanLoading, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        type: "spinner",
    }));
    const __VLS_2 = __VLS_1({
        type: "spinner",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
}
else {
    const __VLS_4 = {}.VanIcon;
    /** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        name: "down",
    }));
    const __VLS_6 = __VLS_5({
        name: "down",
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.pullText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "back-gesture" },
    ...{ class: ({ 'is-active': __VLS_ctx.isBackGesture }) },
});
const __VLS_8 = {}.VanIcon;
/** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    name: "arrow-left",
}));
const __VLS_10 = __VLS_9({
    name: "arrow-left",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
/** @type {__VLS_StyleScopedClasses['gesture-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['pull-refresh']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
/** @type {__VLS_StyleScopedClasses['back-gesture']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            isPulling: isPulling,
            isBackGesture: isBackGesture,
            pullText: pullText,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
