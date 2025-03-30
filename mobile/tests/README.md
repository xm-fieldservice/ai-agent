# 移动端集成测试框架指南

本文档介绍了移动端项目的集成测试框架，包括如何运行测试、解读测试结果和管理测试阶段。

## 测试框架概述

我们的测试框架基于Vitest，并添加了以下扩展功能：

- **阶段化测试**: 将测试分为不同阶段，按顺序执行
- **测试结果保存**: 自动保存测试结果，包括Git信息
- **测试报告生成**: 生成HTML测试报告，支持查看历史结果
- **测试覆盖率**: 集成了代码覆盖率分析

## 测试阶段

我们的测试分为以下几个阶段：

1. **代码集成(code-integration)**: 测试代码模块间的集成
2. **数据库集成(database-integration)**: 测试与MySQL数据库的集成
3. **存储集成(storage-integration)**: 测试与MinIO对象存储的集成
4. **LLM集成(llm-integration)**: 测试与大语言模型的集成
5. **缓存集成(cache-integration)**: 测试与Redis缓存的集成
6. **系统集成(system-integration)**: 测试整体系统的集成

## 如何运行测试

### 运行单个阶段的测试

```bash
# 运行代码集成测试
npm run test:stage:code

# 运行数据库集成测试
npm run test:stage:db

# 运行存储集成测试
npm run test:stage:storage

# 运行LLM集成测试
npm run test:stage:llm

# 运行缓存集成测试
npm run test:stage:cache

# 运行系统集成测试
npm run test:stage:system
```

### 运行所有阶段的测试

```bash
# 运行所有阶段测试
npm run test:stage:all

# 运行所有测试并自动提交结果到Git
npm run test:stage:all -- --commit
```

### 生成测试报告

```bash
# 生成所有阶段的测试报告
npm run test:report
```

## 测试结果

测试结果保存在 `tests/results/{stage}` 目录中，每次测试会生成一个以时间戳命名的JSON文件。

测试报告保存在 `tests/reports` 目录中，包括：
- 各阶段的报告: `{stage}-report.html`
- 综合报告: `complete-report.html`

## 测试代码规范

### 文件命名约定

测试文件应遵循以下命名规则：

- 代码集成测试: `*.integration.test.ts`
- 数据库集成测试: `db.*.test.ts`
- 存储集成测试: `storage.*.test.ts`
- LLM集成测试: `llm.*.test.ts`
- 缓存集成测试: `cache.*.test.ts`
- 系统集成测试: `system.*.test.ts`

### 测试文件的基本结构

```typescript
/**
 * 服务名称 集成测试
 * 简短描述
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServiceToTest } from '../service-to-test';

// 模拟依赖
vi.mock('dependency', () => {
  // 模拟实现
});

describe('服务名称 集成测试', () => {
  let service: ServiceToTest;
  
  beforeEach(() => {
    // 设置测试环境
    service = new ServiceToTest();
  });
  
  afterEach(() => {
    // 清理测试环境
    vi.clearAllMocks();
  });
  
  it('应该正确执行某个功能', () => {
    // 测试代码
    expect(service.someMethod()).toBe(expectedResult);
  });
});
```

## 添加新的测试

### 1. 为新功能创建测试文件

在 `src/services/__tests__` 目录创建相应的测试文件，遵循命名规则。

### 2. 实现测试用例

按照测试文件的基本结构，实现相关的测试用例。

### 3. 运行并验证测试

```bash
# 运行特定阶段的测试
npm run test:stage:code

# 检查测试报告
npm run test:report
```

## 管理测试结果

### 查看测试历史

打开 `tests/reports/{stage}-report.html` 可以查看特定阶段的历史测试结果。

### 清理测试历史

如果需要清理测试历史记录：

```bash
# 清理所有测试结果
rm -rf tests/results/*

# 清理特定阶段的测试结果
rm -rf tests/results/{stage}/*
```

## 最佳实践

1. **逐步进行集成测试**: 先完成独立模块的单元测试，再进行集成测试。
2. **模拟外部依赖**: 使用 `vi.mock()` 模拟外部依赖，避免真实服务的依赖。
3. **保持测试专注**: 每个测试只测试一个功能点，避免复杂的测试用例。
4. **使用有意义的断言消息**: 添加清晰的断言消息，方便定位问题。
5. **定期清理测试结果**: 避免测试结果文件过多影响性能。

## 故障排除

### 测试失败但代码看起来正确

- 检查 mock 是否正确实现
- 验证断言条件是否正确
- 检查异步代码是否正确处理

### 测试通过但实际功能失效

- 检查是否过度模拟（mock）
- 添加更严格的断言
- 考虑添加端到端测试验证完整功能

### 测试报告无法生成

- 确保测试目录结构存在
- 检查是否有文件系统权限
- 查看控制台错误消息排查问题 