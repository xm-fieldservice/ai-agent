import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
}

describe('API 性能测试', () => {
  // 响应时间测试
  it('API响应时间应该在可接受范围内', async () => {
    const ACCEPTABLE_RESPONSE_TIME = 100; // 毫秒
    const metrics: PerformanceMetrics = {
      operation: 'basic-operation',
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      success: false
    };

    // 执行测试操作
    const testData = { id: 'PERF-001', timestamp: Date.now() };
    const resultFile = path.join(process.cwd(), 'tests/results', `${testData.id}.json`);
    
    try {
      // 写入操作
      fs.writeFileSync(resultFile, JSON.stringify(testData));
      
      // 读取操作
      const savedData = JSON.parse(fs.readFileSync(resultFile, 'utf-8'));
      expect(savedData).toEqual(testData);
      
      metrics.success = true;
    } finally {
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      
      // 清理测试文件
      if (fs.existsSync(resultFile)) {
        fs.unlinkSync(resultFile);
      }
    }

    // 验证性能指标
    expect(metrics.duration).toBeLessThanOrEqual(ACCEPTABLE_RESPONSE_TIME);
    expect(metrics.success).toBe(true);
  });

  // 并发操作测试
  it('应该能够处理并发操作', async () => {
    const CONCURRENT_OPERATIONS = 5;
    const operations: Promise<PerformanceMetrics>[] = [];

    for (let i = 0; i < CONCURRENT_OPERATIONS; i++) {
      operations.push(
        new Promise<PerformanceMetrics>(async (resolve) => {
          const metrics: PerformanceMetrics = {
            operation: `concurrent-op-${i}`,
            startTime: Date.now(),
            endTime: 0,
            duration: 0,
            success: false
          };

          try {
            const testData = { id: `PERF-CONCURRENT-${i}`, timestamp: Date.now() };
            const resultFile = path.join(process.cwd(), 'tests/results', `${testData.id}.json`);

            // 写入数据
            fs.writeFileSync(resultFile, JSON.stringify(testData));
            
            // 模拟处理时间
            await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
            
            // 读取数据
            const savedData = JSON.parse(fs.readFileSync(resultFile, 'utf-8'));
            expect(savedData).toEqual(testData);

            // 清理
            fs.unlinkSync(resultFile);
            
            metrics.success = true;
          } finally {
            metrics.endTime = Date.now();
            metrics.duration = metrics.endTime - metrics.startTime;
            resolve(metrics);
          }
        })
      );
    }

    // 等待所有操作完成
    const results = await Promise.all(operations);
    
    // 验证所有操作都成功完成
    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
    });

    // 计算平均响应时间
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    console.log(`平均响应时间: ${avgDuration}ms`);
  });

  // 负载测试
  it('应该能够处理持续负载', async () => {
    const TEST_DURATION = 1000; // 测试持续1秒
    const startTime = Date.now();
    const operations: Promise<PerformanceMetrics>[] = [];

    while (Date.now() - startTime < TEST_DURATION) {
      operations.push(
        new Promise<PerformanceMetrics>(async (resolve) => {
          const metrics: PerformanceMetrics = {
            operation: 'load-test',
            startTime: Date.now(),
            endTime: 0,
            duration: 0,
            success: false
          };

          try {
            const testData = { id: `PERF-LOAD-${Date.now()}`, timestamp: Date.now() };
            const resultFile = path.join(process.cwd(), 'tests/results', `${testData.id}.json`);

            fs.writeFileSync(resultFile, JSON.stringify(testData));
            const savedData = JSON.parse(fs.readFileSync(resultFile, 'utf-8'));
            expect(savedData).toEqual(testData);
            fs.unlinkSync(resultFile);

            metrics.success = true;
          } finally {
            metrics.endTime = Date.now();
            metrics.duration = metrics.endTime - metrics.startTime;
            resolve(metrics);
          }
        })
      );

      // 控制操作间隔
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 等待所有操作完成
    const results = await Promise.all(operations);
    
    // 计算性能指标
    const totalOperations = results.length;
    const successfulOperations = results.filter(r => r.success).length;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const maxDuration = Math.max(...results.map(r => r.duration));

    console.log(`
性能测试结果:
- 总操作数: ${totalOperations}
- 成功操作: ${successfulOperations}
- 平均响应时间: ${avgDuration.toFixed(2)}ms
- 最大响应时间: ${maxDuration}ms
    `);

    expect(successfulOperations).toBe(totalOperations);
  });
}); 