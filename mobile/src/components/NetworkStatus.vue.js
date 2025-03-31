/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted, onUnmounted } from 'vue';
import { showToast } from 'vant';
const isOnline = ref(navigator.onLine);
const statusText = ref('');
const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine;
    statusText.value = isOnline.value ? '已连接网络' : '当前处于离线状态';
    showToast({
        type: isOnline.value ? 'success' : 'warning',
        message: statusText.value,
        duration: 2000
    });
};
onMounted(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
});
onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "network-status" },
    ...{ class: ({ 'is-offline': !__VLS_ctx.isOnline }) },
});
const __VLS_0 = {}.VanIcon;
/** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    name: (__VLS_ctx.isOnline ? 'wifi' : 'warning'),
}));
const __VLS_2 = __VLS_1({
    name: (__VLS_ctx.isOnline ? 'wifi' : 'warning'),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.statusText);
/** @type {__VLS_StyleScopedClasses['network-status']} */ ;
/** @type {__VLS_StyleScopedClasses['is-offline']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            isOnline: isOnline,
            statusText: statusText,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
