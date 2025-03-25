/**
 * 全局类型定义
 */

interface Window {
  monitoring: any;
  generateTestData: () => void;
}

declare global {
  interface Window {
    monitoring: any;
    generateTestData: () => void;
  }
} 