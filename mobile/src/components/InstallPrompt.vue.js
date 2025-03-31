/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
export default (await import('vue')).defineComponent({
    name: 'InstallPrompt',
    data() {
        return {
            showPrompt: false,
            deferredPrompt: null
        };
    },
    mounted() {
        window.addEventListener('beforeinstallprompt', this.handleInstallPrompt);
    },
    beforeUnmount() {
        window.removeEventListener('beforeinstallprompt', this.handleInstallPrompt);
    },
    methods: {
        handleInstallPrompt(e) {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showPrompt = true;
        },
        async installPWA() {
            if (!this.deferredPrompt)
                return;
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('用户已接受安装PWA');
            }
            else {
                console.log('用户已取消安装PWA');
            }
            this.deferredPrompt = null;
            this.showPrompt = false;
        },
        closePrompt() {
            this.showPrompt = false;
        }
    }
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
if (__VLS_ctx.showPrompt) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "install-prompt" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "prompt-content" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "prompt-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img, __VLS_intrinsicElements.img)({
        src: "/vite.svg",
        alt: "AI助手",
        ...{ class: "app-icon" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "app-info" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "prompt-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.installPWA) },
        ...{ class: "install-btn" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.closePrompt) },
        ...{ class: "cancel-btn" },
    });
}
/** @type {__VLS_StyleScopedClasses['install-prompt']} */ ;
/** @type {__VLS_StyleScopedClasses['prompt-content']} */ ;
/** @type {__VLS_StyleScopedClasses['prompt-header']} */ ;
/** @type {__VLS_StyleScopedClasses['app-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['app-info']} */ ;
/** @type {__VLS_StyleScopedClasses['prompt-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['install-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['cancel-btn']} */ ;
var __VLS_dollars;
let __VLS_self;
