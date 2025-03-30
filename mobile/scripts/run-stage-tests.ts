/**
 * 阶段测试运行器
 * 用于运行特定阶段的测试并记录结果
 */

import { execSync } from 'child_process';
import { TestStage, saveTestResult, getLatestTestResult, generateTestReport } from './test-utils';

// 命令行参数
const args = process.argv.slice(2);
const stage = args[0] as TestStage;
const updateGit = args.includes('--git');

// 检查阶段参数
if (!stage || !Object.values(TestStage).includes(stage)) {
  console.error(`错误: 需要提供有效的测试阶段。可用阶段: ${Object.values(TestStage).join(', ')}`);
  process.exit(1);
}

// 根据阶段获取测试模式
function getTestPattern(stage: TestStage): string {
  switch (stage) {
    case TestStage.CODE_INTEGRATION:
      return 'src/**/*.integration.test.ts';
    case TestStage.DATABASE_INTEGRATION:
      return 'src/**/db.*.test.ts';
    case TestStage.STORAGE_INTEGRATION:
      return 'src/**/storage.*.test.ts';
    case TestStage.LLM_INTEGRATION:
      return 'src/**/llm.*.test.ts';
    case TestStage.CACHE_INTEGRATION:
      return 'src/**/cache.*.test.ts';
    case TestStage.SYSTEM_INTEGRATION:
      return 'src/**/system.*.test.ts';
    default:
      return 'src/**/*.test.ts';
  }
}

/**
 * 运行测试
 */
async function runTests() {
  console.log(`运行阶段测试: ${stage}`);
  
  // 获取测试模式
  const testPattern = getTestPattern(stage);
  console.log(`测试文件匹配模式: ${testPattern}`);
  
  const startTime = Date.now();
  let success = false;
  let testsPassed = 0;
  let testsFailed = 0;
  let coverage = 0;
  let details = {};
  
  try {
    // 运行测试并捕获输出
    const testCommand = `npx vitest run --coverage ${testPattern}`;
    console.log(`执行命令: ${testCommand}`);
    
    const output = execSync(testCommand, { encoding: 'utf-8' });
    console.log(output);
    
    // 解析测试结果
    success = !output.includes('FAIL');
    
    // 解析通过/失败的测试数量
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    
    testsPassed = passedMatch ? parseInt(passedMatch[1]) : 0;
    testsFailed = failedMatch ? parseInt(failedMatch[1]) : 0;
    
    // 解析覆盖率
    const coverageMatch = output.match(/Statements\s*:\s*([\d.]+)%/);
    coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;
    
    details = { output };
  } catch (error) {
    console.error('测试执行失败:', error);
    success = false;
    details = { error: String(error) };
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // 保存测试结果
  const result = {
    stage,
    timestamp: new Date().toISOString(),
    success,
    testsPassed,
    testsFailed,
    testCoverage: coverage,
    duration,
    details
  };
  
  saveTestResult(result);
  
  // 生成报告
  generateTestReport(stage);
  
  // 如果需要，将结果提交到Git
  if (updateGit) {
    try {
      const commitMessage = `test(${stage}): 更新测试结果 [${success ? '通过' : '失败'}]`;
      
      execSync('git add tests/results tests/reports', { encoding: 'utf-8' });
      execSync(`git commit -m "${commitMessage}"`, { encoding: 'utf-8' });
      
      console.log('测试结果已提交到Git');
    } catch (error) {
      console.error('Git提交失败:', error);
    }
  }
  
  // 比较与上一次结果
  const previousResult = getLatestTestResult(stage);
  if (previousResult) {
    console.log(`\n与上一次测试结果比较:`);
    console.log(`- 上一次: ${previousResult.success ? '通过' : '失败'} (${previousResult.testsPassed}/${previousResult.testsPassed + previousResult.testsFailed})`);
    console.log(`- 本次: ${success ? '通过' : '失败'} (${testsPassed}/${testsPassed + testsFailed})`);
    
    if (previousResult.testCoverage !== undefined && coverage !== undefined) {
      const diff = coverage - previousResult.testCoverage;
      console.log(`- 覆盖率变化: ${diff > 0 ? '+' : ''}${diff.toFixed(2)}%`);
    }
  }
  
  // 返回成功状态
  process.exit(success ? 0 : 1);
}

// 执行测试
runTests().catch(error => {
  console.error('运行测试出错:', error);
  process.exit(1);
}); 