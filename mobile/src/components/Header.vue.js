/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref } from 'vue';
import { useModelStore } from '../stores/model';
const modelStore = useModelStore();
const showModelSelect = ref(false);
const { currentModel, models } = modelStore;
const emit = defineEmits(['toggle-menu', 'toggle-phone']);
const toggleMenu = () => {
    emit('toggle-menu');
};
const togglePhone = () => {
    emit('toggle-phone');
};
const selectModel = (model) => {
    modelStore.setCurrentModel(model);
    showModelSelect.value = false;
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header safe-area-top" },
});
const __VLS_0 = {}.VanNavBar;
/** @type {[typeof __VLS_components.VanNavBar, typeof __VLS_components.vanNavBar, typeof __VLS_components.VanNavBar, typeof __VLS_components.vanNavBar, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClickLeft': {} },
    title: (__VLS_ctx.currentModel.name),
    leftArrow: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClickLeft': {} },
    title: (__VLS_ctx.currentModel.name),
    leftArrow: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClickLeft: (__VLS_ctx.toggleMenu)
};
__VLS_3.slots.default;
{
    const { right: __VLS_thisSlot } = __VLS_3.slots;
    const __VLS_8 = {}.VanIcon;
    /** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        ...{ 'onClick': {} },
        name: "exchange",
        size: "18",
    }));
    const __VLS_10 = __VLS_9({
        ...{ 'onClick': {} },
        name: "exchange",
        size: "18",
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    let __VLS_12;
    let __VLS_13;
    let __VLS_14;
    const __VLS_15 = {
        onClick: (...[$event]) => {
            __VLS_ctx.showModelSelect = true;
        }
    };
    var __VLS_11;
    const __VLS_16 = {}.VanIcon;
    /** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        ...{ 'onClick': {} },
        name: "phone-o",
        size: "18",
        ...{ class: "ml-4" },
    }));
    const __VLS_18 = __VLS_17({
        ...{ 'onClick': {} },
        name: "phone-o",
        size: "18",
        ...{ class: "ml-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    let __VLS_20;
    let __VLS_21;
    let __VLS_22;
    const __VLS_23 = {
        onClick: (__VLS_ctx.togglePhone)
    };
    var __VLS_19;
}
var __VLS_3;
const __VLS_24 = {}.VanPopup;
/** @type {[typeof __VLS_components.VanPopup, typeof __VLS_components.vanPopup, typeof __VLS_components.VanPopup, typeof __VLS_components.vanPopup, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    show: (__VLS_ctx.showModelSelect),
    position: "bottom",
    round: true,
    closeable: true,
}));
const __VLS_26 = __VLS_25({
    show: (__VLS_ctx.showModelSelect),
    position: "bottom",
    round: true,
    closeable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "model-select" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "title" },
});
const __VLS_28 = {}.VanCellGroup;
/** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({}));
const __VLS_30 = __VLS_29({}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
for (const [model] of __VLS_getVForSourceType((__VLS_ctx.models))) {
    const __VLS_32 = {}.VanCell;
    /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        ...{ 'onClick': {} },
        key: (model.id),
        title: (model.name),
        clickable: true,
    }));
    const __VLS_34 = __VLS_33({
        ...{ 'onClick': {} },
        key: (model.id),
        title: (model.name),
        clickable: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    let __VLS_36;
    let __VLS_37;
    let __VLS_38;
    const __VLS_39 = {
        onClick: (...[$event]) => {
            __VLS_ctx.selectModel(model);
        }
    };
    var __VLS_35;
}
var __VLS_31;
var __VLS_27;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['safe-area-top']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-4']} */ ;
/** @type {__VLS_StyleScopedClasses['model-select']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            $emit: emit,
            showModelSelect: showModelSelect,
            currentModel: currentModel,
            models: models,
            toggleMenu: toggleMenu,
            togglePhone: togglePhone,
            selectModel: selectModel,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {
            $emit: emit,
        };
    },
});
; /* PartiallyEnd: #4569/main.vue */
