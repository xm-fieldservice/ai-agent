/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useIntersectionObserver } from '@vueuse/core';
const props = defineProps();
const emit = defineEmits();
// 状态
const loading = ref(false);
const isLoaded = ref(false);
const errorMessage = ref(null);
const loadingProgress = ref(null);
const imageRef = ref(null);
const videoRef = ref(null);
const audioRef = ref(null);
// 计算属性
const mediaStyle = computed(() => {
    if (props.width && props.height) {
        return {
            aspectRatio: `${props.width}/${props.height}`,
            maxWidth: '100%',
            height: 'auto'
        };
    }
    return {};
});
const thumbnailStyle = computed(() => {
    return {
        filter: 'blur(10px)',
        transform: 'scale(1.1)'
    };
});
// 方法
function handleLoad() {
    isLoaded.value = true;
    loading.value = false;
    errorMessage.value = null;
    emit('load');
}
function handleError(event) {
    loading.value = false;
    errorMessage.value = '加载失败';
    emit('error', event.error || new Error('加载失败'));
}
function retryLoading() {
    errorMessage.value = null;
    loading.value = true;
    loadMedia();
}
function handleFileClick() {
    emit('click');
}
function formatFileSize(bytes) {
    if (!bytes)
        return '未知大小';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}
// 加载媒体
async function loadMedia() {
    if (isLoaded.value || loading.value)
        return;
    loading.value = true;
    loadingProgress.value = 0;
    try {
        if (props.type === 'image') {
            // 图片加载进度模拟
            const interval = setInterval(() => {
                if (loadingProgress.value && loadingProgress.value < 90) {
                    loadingProgress.value += 10;
                }
            }, 200);
            // 清理定时器
            onUnmounted(() => clearInterval(interval));
        }
        else if (props.type === 'video' || props.type === 'audio') {
            const mediaElement = props.type === 'video' ? videoRef.value : audioRef.value;
            if (mediaElement) {
                mediaElement.load();
            }
        }
    }
    catch (error) {
        console.error('媒体加载失败:', error);
        errorMessage.value = '加载失败';
        loading.value = false;
    }
}
// 使用 Intersection Observer 实现懒加载
const { stop } = useIntersectionObserver(imageRef, ([{ isIntersecting }]) => {
    if (isIntersecting) {
        loadMedia();
        stop();
    }
}, { threshold: 0.1 });
onMounted(() => {
    if (props.type !== 'image') {
        loadMedia();
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['thumbnail']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "lazy-media" },
    ...{ class: ([__VLS_ctx.type, { loading: __VLS_ctx.loading, error: !!__VLS_ctx.errorMessage }]) },
    ...{ style: (__VLS_ctx.mediaStyle) },
});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading-spinner" },
    });
    if (__VLS_ctx.loadingProgress) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "loading-progress" },
        });
        (Math.round(__VLS_ctx.loadingProgress));
    }
}
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "error-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "error-message" },
    });
    (__VLS_ctx.errorMessage);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.retryLoading) },
        ...{ class: "retry-button" },
    });
}
if (__VLS_ctx.type === 'image') {
    if (__VLS_ctx.thumbnailUrl && !__VLS_ctx.isLoaded) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (__VLS_ctx.thumbnailUrl),
            ...{ class: "thumbnail" },
            ...{ style: (__VLS_ctx.thumbnailStyle) },
            alt: "缩略图",
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        ...{ onLoad: (__VLS_ctx.handleLoad) },
        ...{ onError: (__VLS_ctx.handleError) },
        ref: "imageRef",
        src: (__VLS_ctx.url),
        alt: (__VLS_ctx.alt),
        ...{ class: "full-image" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.isLoaded) }, null, null);
    /** @type {typeof __VLS_ctx.imageRef} */ ;
}
else if (__VLS_ctx.type === 'video') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.video, __VLS_intrinsicElements.video)({
        ...{ onLoadedmetadata: (__VLS_ctx.handleLoad) },
        ...{ onError: (__VLS_ctx.handleError) },
        ref: "videoRef",
        ...{ class: "video-player" },
        poster: (__VLS_ctx.thumbnailUrl),
        controls: true,
        preload: "metadata",
    });
    /** @type {typeof __VLS_ctx.videoRef} */ ;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.source, __VLS_intrinsicElements.source)({
        src: (__VLS_ctx.url),
        type: (__VLS_ctx.mediaType),
    });
}
else if (__VLS_ctx.type === 'audio') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.audio, __VLS_intrinsicElements.audio)({
        ...{ onLoadedmetadata: (__VLS_ctx.handleLoad) },
        ...{ onError: (__VLS_ctx.handleError) },
        ref: "audioRef",
        ...{ class: "audio-player" },
        controls: true,
        preload: "metadata",
    });
    /** @type {typeof __VLS_ctx.audioRef} */ ;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.source, __VLS_intrinsicElements.source)({
        src: (__VLS_ctx.url),
        type: (__VLS_ctx.mediaType),
    });
}
else if (__VLS_ctx.type === 'file') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.handleFileClick) },
        ...{ class: "file-preview" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "file-icon" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        viewBox: "0 0 24 24",
        width: "24",
        height: "24",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z",
        fill: "currentColor",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M14 3v5h5",
        fill: "currentColor",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "file-info" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "file-name" },
    });
    (__VLS_ctx.fileName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "file-size" },
    });
    (__VLS_ctx.formatFileSize(__VLS_ctx.fileSize));
}
/** @type {__VLS_StyleScopedClasses['lazy-media']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-spinner']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-progress']} */ ;
/** @type {__VLS_StyleScopedClasses['error-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['retry-button']} */ ;
/** @type {__VLS_StyleScopedClasses['thumbnail']} */ ;
/** @type {__VLS_StyleScopedClasses['full-image']} */ ;
/** @type {__VLS_StyleScopedClasses['video-player']} */ ;
/** @type {__VLS_StyleScopedClasses['audio-player']} */ ;
/** @type {__VLS_StyleScopedClasses['file-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['file-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['file-info']} */ ;
/** @type {__VLS_StyleScopedClasses['file-name']} */ ;
/** @type {__VLS_StyleScopedClasses['file-size']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            loading: loading,
            isLoaded: isLoaded,
            errorMessage: errorMessage,
            loadingProgress: loadingProgress,
            imageRef: imageRef,
            videoRef: videoRef,
            audioRef: audioRef,
            mediaStyle: mediaStyle,
            thumbnailStyle: thumbnailStyle,
            handleLoad: handleLoad,
            handleError: handleError,
            retryLoading: retryLoading,
            handleFileClick: handleFileClick,
            formatFileSize: formatFileSize,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
