/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { isIOS, isAndroid, keyboardHeight, isKeyboardVisible, safeAreaTop, safeAreaBottom, windowHeight, disableScroll, enableScroll } from '@/utils/mobileAdapter';
const router = useRouter();
const inputText = ref('');
const isScrollDisabled = ref(false);
const deviceType = computed(() => {
    if (isIOS)
        return 'iOS设备';
    if (isAndroid)
        return 'Android设备';
    return '其他设备';
});
const toggleScroll = () => {
    if (isScrollDisabled.value) {
        enableScroll();
    }
    else {
        disableScroll();
    }
    isScrollDisabled.value = !isScrollDisabled.value;
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['top-area']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-area']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "test-view" },
});
const __VLS_0 = {}.VanNavBar;
/** @type {[typeof __VLS_components.VanNavBar, typeof __VLS_components.vanNavBar, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClickLeft': {} },
    title: "移动端适配测试",
    leftArrow: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClickLeft': {} },
    title: "移动端适配测试",
    leftArrow: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClickLeft: (...[$event]) => {
        __VLS_ctx.router.back();
    }
};
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "test-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
const __VLS_8 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    modelValue: (__VLS_ctx.inputText),
    label: "输入测试",
    placeholder: "点击输入，测试键盘弹出",
    autosize: ({ maxHeight: 100, minHeight: 50 }),
}));
const __VLS_10 = __VLS_9({
    modelValue: (__VLS_ctx.inputText),
    label: "输入测试",
    placeholder: "点击输入，测试键盘弹出",
    autosize: ({ maxHeight: 100, minHeight: 50 }),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "status" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.isKeyboardVisible ? '显示' : '隐藏');
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.keyboardHeight);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "test-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
const __VLS_12 = {}.VanCellGroup;
/** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    inset: true,
}));
const __VLS_14 = __VLS_13({
    inset: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
const __VLS_16 = {}.VanCell;
/** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    title: "下拉刷新",
}));
const __VLS_18 = __VLS_17({
    title: "下拉刷新",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
{
    const { label: __VLS_thisSlot } = __VLS_19.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
var __VLS_19;
if (__VLS_ctx.isIOS) {
    const __VLS_20 = {}.VanCell;
    /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        title: "返回手势",
    }));
    const __VLS_22 = __VLS_21({
        title: "返回手势",
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    __VLS_23.slots.default;
    {
        const { label: __VLS_thisSlot } = __VLS_23.slots;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    var __VLS_23;
}
var __VLS_15;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "test-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "safe-area-demo" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "top-area" },
});
(__VLS_ctx.safeAreaTop);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bottom-area" },
});
(__VLS_ctx.safeAreaBottom);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "test-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
const __VLS_24 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    ...{ 'onClick': {} },
    type: "primary",
}));
const __VLS_26 = __VLS_25({
    ...{ 'onClick': {} },
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_28;
let __VLS_29;
let __VLS_30;
const __VLS_31 = {
    onClick: (__VLS_ctx.toggleScroll)
};
__VLS_27.slots.default;
(__VLS_ctx.isScrollDisabled ? '启用滚动' : '禁用滚动');
var __VLS_27;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "scroll-area" },
});
for (const [i] of __VLS_getVForSourceType((20))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        key: (i),
    });
    (i);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "test-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
const __VLS_32 = {}.VanCellGroup;
/** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    inset: true,
}));
const __VLS_34 = __VLS_33({
    inset: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
const __VLS_36 = {}.VanCell;
/** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    title: "设备类型",
    value: (__VLS_ctx.deviceType),
}));
const __VLS_38 = __VLS_37({
    title: "设备类型",
    value: (__VLS_ctx.deviceType),
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
const __VLS_40 = {}.VanCell;
/** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    title: "窗口高度",
    value: (`${__VLS_ctx.windowHeight}px`),
}));
const __VLS_42 = __VLS_41({
    title: "窗口高度",
    value: (`${__VLS_ctx.windowHeight}px`),
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
const __VLS_44 = {}.VanCell;
/** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    title: "视口宽度",
    value: (`${__VLS_ctx.window.innerWidth}px`),
}));
const __VLS_46 = __VLS_45({
    title: "视口宽度",
    value: (`${__VLS_ctx.window.innerWidth}px`),
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
var __VLS_35;
/** @type {__VLS_StyleScopedClasses['test-view']} */ ;
/** @type {__VLS_StyleScopedClasses['test-section']} */ ;
/** @type {__VLS_StyleScopedClasses['status']} */ ;
/** @type {__VLS_StyleScopedClasses['test-section']} */ ;
/** @type {__VLS_StyleScopedClasses['test-section']} */ ;
/** @type {__VLS_StyleScopedClasses['safe-area-demo']} */ ;
/** @type {__VLS_StyleScopedClasses['top-area']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-area']} */ ;
/** @type {__VLS_StyleScopedClasses['test-section']} */ ;
/** @type {__VLS_StyleScopedClasses['scroll-area']} */ ;
/** @type {__VLS_StyleScopedClasses['test-section']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            isIOS: isIOS,
            keyboardHeight: keyboardHeight,
            isKeyboardVisible: isKeyboardVisible,
            safeAreaTop: safeAreaTop,
            safeAreaBottom: safeAreaBottom,
            windowHeight: windowHeight,
            router: router,
            inputText: inputText,
            isScrollDisabled: isScrollDisabled,
            deviceType: deviceType,
            toggleScroll: toggleScroll,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
