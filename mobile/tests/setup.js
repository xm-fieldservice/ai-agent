/**
 * 测试环境初始化
 */

// 模拟环境变量
process.env.NODE_ENV = 'test';

// 模拟浏览器API
global.performance = {
  getEntriesByType: jest.fn().mockReturnValue([]),
  measure: jest.fn().mockReturnValue({ duration: 100 }),
  mark: jest.fn()
};

class PerformanceObserver {
  observe() {}
  disconnect() {}
}

global.PerformanceObserver = PerformanceObserver;

// 模拟导航API
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'jest-test-agent',
    platform: 'test',
    serviceWorker: {
      register: jest.fn().mockResolvedValue({
        scope: '/test/',
        addEventListener: jest.fn()
      }),
      ready: Promise.resolve({
        update: jest.fn(),
        unregister: jest.fn()
      })
    }
  },
  writable: true
});

// 模拟Fetch API
global.fetch = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({
      'content-type': 'application/json',
      'content-length': '123'
    }),
    json: () => Promise.resolve({ data: 'test' }),
    text: () => Promise.resolve('{"data":"test"}'),
    clone: function() { return this; }
  });
});

// 模拟localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn(index => Object.keys(store)[index] || null),
    length: jest.fn(() => Object.keys(store).length)
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// 模拟sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
  writable: true
});

// 模拟IntersectionObserver
class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.IntersectionObserver = IntersectionObserver;

// 抑制控制台输出
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

if (process.env.SUPPRESS_CONSOLE) {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}

// 在所有测试后恢复控制台
afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
}); 