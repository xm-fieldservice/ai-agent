/**
 * 简化版测试运行脚本
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// 测试阶段枚举
enum TestStage {
  CODE = 'code',
  DATABASE = 'database',
  STORAGE = 'storage',
  LLM = 'llm',
  CACHE = 'cache',
  SYSTEM = 'system'
}

// 命令行参数
const stage = process.argv[2] as TestStage;
if (!stage) {
  console.error('请指定测试阶段: code, database, storage, llm, cache, system');
  process.exit(1);
}

// 运行测试
console.log(`运行${stage}阶段测试...`);
const startTime = Date.now();
let success = false;
let output = '';

try {
  // 根据阶段选择测试文件模式
  let pattern = '';
  switch (stage) {
    case TestStage.CODE: pattern = 'src/**/*.integration.test.ts'; break;
    case TestStage.DATABASE: pattern = 'src/**/db.*.test.ts'; break;
    case TestStage.STORAGE: pattern = 'src/**/storage.*.test.ts'; break;
    case TestStage.LLM: pattern = 'src/**/llm.*.test.ts'; break;
    case TestStage.CACHE: pattern = 'src/**/cache.*.test.ts'; break;
    case TestStage.SYSTEM: pattern = 'src/**/system.*.test.ts'; break;
  }
  
  // 执行测试
  output = execSync(`npx vitest run ${pattern}`, { encoding: 'utf-8' });
  console.log(output);
  success = !output.includes('FAIL');
} catch (error) {
  console.error('测试执行失败:', error);
  success = false;
}

const duration = Date.now() - startTime;

// 保存结果
const resultsDir = path.resolve(__dirname, '../results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

const result = {
  stage,
  timestamp: new Date().toISOString(),
  success,
  duration,
  output: output.substring(0, 500) + (output.length > 500 ? '...(截断)' : '')
};

const fileName = `${stage}_${new Date().toISOString().replace(/:/g, '-')}.json`;
fs.writeFileSync(path.join(resultsDir, fileName), JSON.stringify(result, null, 2));

// 输出结果
console.log(`\n测试结果: ${success ? '通过' : '失败'}`);
console.log(`耗时: ${duration}ms`);
console.log(`结果已保存至: ${path.join(resultsDir, fileName)}`);

process.exit(success ? 0 : 1); 