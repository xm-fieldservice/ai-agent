/// <reference types="vitest/globals" />
/// <reference types="@vue/test-utils" />
import { vi } from 'vitest';
import { config } from '@vue/test-utils';
// 模拟 ResizeObserver
class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}
// 模拟 IntersectionObserver
class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    constructor(callback) {
        // 实现必要的逻辑
    }
}
// 全局模拟
Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: MockResizeObserver
});
Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver
});
// 模拟 fetch
window.fetch = vi.fn();
// 模拟 window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
    }))
});
// 配置 Vue Test Utils
config.global.mocks = {
// 添加全局模拟
};
