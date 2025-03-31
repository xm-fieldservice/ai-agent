/// <reference types="../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { initMobileAdapter, updateLayout } from './utils/mobileAdapter';
import InstallPrompt from './components/InstallPrompt.vue';
import NetworkStatus from './components/NetworkStatus.vue';
import GestureFeedback from './components/GestureFeedback.vue';
import { featureService } from './services/feature-service';
const isKeyboardOpen = ref(false);
// 监听键盘状态
const handleKeyboardState = () => {
    isKeyboardOpen.value = document.body.classList.contains('keyboard-open');
    updateLayout();
};
// 监听窗口大小变化
const handleResize = () => {
    updateLayout();
};
onMounted(async () => {
    try {
        // 初始化移动端适配
        initMobileAdapter();
        // 初始化功能服务
        await featureService.initialize();
        console.info('移动端应用初始化完成');
        // 添加事件监听
        document.body.addEventListener('classChange', handleKeyboardState);
        window.addEventListener('resize', handleResize);
        // 初始布局
        updateLayout();
    }
    catch (error) {
        console.error('应用初始化失败:', error);
    }
});
onBeforeUnmount(() => {
    // 移除事件监听
    document.body.removeEventListener('classChange', handleKeyboardState);
    window.removeEventListener('resize', handleResize);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "app",
    ...{ class: ({ 'keyboard-open': __VLS_ctx.isKeyboardOpen }) },
});
/** @type {[typeof NetworkStatus, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(NetworkStatus, new NetworkStatus({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
/** @type {[typeof GestureFeedback, ]} */ ;
// @ts-ignore
const __VLS_3 = __VLS_asFunctionalComponent(GestureFeedback, new GestureFeedback({}));
const __VLS_4 = __VLS_3({}, ...__VLS_functionalComponentArgsRest(__VLS_3));
const __VLS_6 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({}));
const __VLS_8 = __VLS_7({}, ...__VLS_functionalComponentArgsRest(__VLS_7));
{
    const { default: __VLS_thisSlot } = __VLS_9.slots;
    const [{ Component }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_10 = {}.KeepAlive;
    /** @type {[typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, ]} */ ;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent(__VLS_10, new __VLS_10({}));
    const __VLS_12 = __VLS_11({}, ...__VLS_functionalComponentArgsRest(__VLS_11));
    __VLS_13.slots.default;
    const __VLS_14 = ((Component));
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent(__VLS_14, new __VLS_14({}));
    const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
    var __VLS_13;
    __VLS_9.slots['' /* empty slot name completion */];
}
var __VLS_9;
/** @type {[typeof InstallPrompt, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(InstallPrompt, new InstallPrompt({}));
const __VLS_19 = __VLS_18({}, ...__VLS_functionalComponentArgsRest(__VLS_18));
/** @type {__VLS_StyleScopedClasses['keyboard-open']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            InstallPrompt: InstallPrompt,
            NetworkStatus: NetworkStatus,
            GestureFeedback: GestureFeedback,
            isKeyboardOpen: isKeyboardOpen,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
