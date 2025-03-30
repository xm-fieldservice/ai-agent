/**
 * 示例集成测试
 */
import { describe, it, expect } from 'vitest';

describe('示例集成测试', () => {
  it('应该能正确运行测试', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('应该能正确处理异步操作', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });
}); 