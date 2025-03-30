/**
 * 运行所有阶段测试的脚本
 */

import { execSync } from 'child_process';
import { TestStage } from './test-utils';

// 命令行参数
const args = process.argv.slice(2);
const shouldCommit = args.includes('--commit');

/**
 * 运行所有阶段测试
 */
async function runAllTests() {
  console.log('开始运行所有阶段测试...');
  
  const stages = Object.values(TestStage);
  const results: Record<string, boolean> = {};
  
  // 按顺序运行每个阶段的测试
  for (const stage of stages) {
    console.log(`\n========== 运行阶段: ${stage} ==========\n`);
    
    try {
      // 构建命令，如果需要自动提交，则添加--git参数
      const cmd = `ts-node scripts/run-stage-tests.ts ${stage}${shouldCommit ? ' --git' : ''}`;
      execSync(cmd, { stdio: 'inherit' });
      
      results[stage] = true;
      console.log(`\n✅ 阶段 ${stage} 测试通过\n`);
    } catch (error) {
      results[stage] = false;
      console.error(`\n❌ 阶段 ${stage} 测试失败: ${error}\n`);
    }
  }
  
  // 生成测试报告
  try {
    console.log('\n========== 生成测试报告 ==========\n');
    execSync('ts-node scripts/generate-report.ts', { stdio: 'inherit' });
  } catch (error) {
    console.error('生成测试报告失败:', error);
  }
  
  // 显示测试结果摘要
  console.log('\n========== 测试结果摘要 ==========\n');
  let passCount = 0;
  
  for (const stage of stages) {
    const pass = results[stage] || false;
    if (pass) passCount++;
    console.log(`${pass ? '✅' : '❌'} ${stage}`);
  }
  
  const passRate = (passCount / stages.length * 100).toFixed(2);
  console.log(`\n通过率: ${passRate}% (${passCount}/${stages.length})`);
  
  // 如果需要自动提交，将测试报告提交到Git
  if (shouldCommit) {
    try {
      const commitMessage = `test: 更新集成测试报告 [通过率: ${passRate}%]`;
      execSync('git add tests/reports', { stdio: 'inherit' });
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      console.log('\nGit提交成功');
    } catch (error) {
      console.error('\nGit提交失败:', error);
    }
  }
  
  // 返回是否全部通过
  return passCount === stages.length;
}

// 执行测试
runAllTests().then(allPassed => {
  if (allPassed) {
    console.log('\n🎉 所有测试通过!');
    process.exit(0);
  } else {
    console.log('\n⚠️ 部分测试失败，请检查报告!');
    process.exit(1);
  }
}).catch(error => {
  console.error('运行测试出错:', error);
  process.exit(1);
}); 