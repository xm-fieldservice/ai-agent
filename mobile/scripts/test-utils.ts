/**
 * 测试工具函数
 * 用于保存测试结果、管理测试阶段和生成测试报告
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// 定义测试阶段
export enum TestStage {
  CODE_INTEGRATION = 'code-integration',
  DATABASE_INTEGRATION = 'database-integration',
  STORAGE_INTEGRATION = 'storage-integration',
  LLM_INTEGRATION = 'llm-integration',
  CACHE_INTEGRATION = 'cache-integration',
  SYSTEM_INTEGRATION = 'system-integration'
}

// 测试结果接口
export interface TestResult {
  stage: TestStage;
  timestamp: string;
  success: boolean;
  testsPassed: number;
  testsFailed: number;
  testCoverage?: number;
  duration: number;
  gitCommit?: string;
  gitBranch?: string;
  details?: any;
}

/**
 * 保存测试结果
 * @param result 测试结果对象
 */
export function saveTestResult(result: TestResult): void {
  // 确保目录存在
  const resultsDir = path.resolve(__dirname, '../tests/results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  // 按阶段分组保存
  const stageDir = path.join(resultsDir, result.stage);
  if (!fs.existsSync(stageDir)) {
    fs.mkdirSync(stageDir, { recursive: true });
  }
  
  // 生成文件名
  const fileName = `${result.timestamp.replace(/[: ]/g, '-')}_${result.success ? 'pass' : 'fail'}.json`;
  const filePath = path.join(stageDir, fileName);
  
  // 添加Git信息
  try {
    result.gitCommit = execSync('git rev-parse HEAD').toString().trim();
    result.gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch (error) {
    console.warn('无法获取Git信息:', error);
  }
  
  // 写入文件
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
  console.log(`测试结果已保存到: ${filePath}`);
  
  // 更新最新结果链接
  const latestFilePath = path.join(stageDir, 'latest.json');
  fs.writeFileSync(latestFilePath, JSON.stringify(result, null, 2));
}

/**
 * 获取测试阶段的最新结果
 * @param stage 测试阶段
 * @returns 最新测试结果或undefined
 */
export function getLatestTestResult(stage: TestStage): TestResult | undefined {
  const latestFilePath = path.resolve(__dirname, `../tests/results/${stage}/latest.json`);
  
  if (fs.existsSync(latestFilePath)) {
    try {
      const content = fs.readFileSync(latestFilePath, 'utf-8');
      return JSON.parse(content) as TestResult;
    } catch (error) {
      console.error(`读取最新测试结果失败:`, error);
      return undefined;
    }
  }
  
  return undefined;
}

/**
 * 获取阶段的所有测试结果
 * @param stage 测试阶段
 * @returns 测试结果数组
 */
export function getAllTestResults(stage: TestStage): TestResult[] {
  const stageDir = path.resolve(__dirname, `../tests/results/${stage}`);
  
  if (!fs.existsSync(stageDir)) {
    return [];
  }
  
  const results: TestResult[] = [];
  
  fs.readdirSync(stageDir).forEach(file => {
    if (file !== 'latest.json' && file.endsWith('.json')) {
      try {
        const content = fs.readFileSync(path.join(stageDir, file), 'utf-8');
        results.push(JSON.parse(content) as TestResult);
      } catch (error) {
        console.error(`读取测试结果失败: ${file}`, error);
      }
    }
  });
  
  // 按时间戳排序
  return results.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

/**
 * 生成测试报告
 * @param stage 测试阶段
 * @returns 报告HTML字符串
 */
export function generateTestReport(stage: TestStage): string {
  const results = getAllTestResults(stage);
  
  if (results.length === 0) {
    return `<h1>测试阶段 ${stage} 没有测试结果</h1>`;
  }
  
  // 生成HTML报告
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>测试报告 - ${stage}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .success { color: green; }
        .failure { color: red; }
        .summary { margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>测试阶段: ${stage}</h1>
      <div class="summary">
        <p>总测试次数: ${results.length}</p>
        <p>通过次数: ${results.filter(r => r.success).length}</p>
        <p>失败次数: ${results.filter(r => !r.success).length}</p>
      </div>
      <table>
        <tr>
          <th>时间戳</th>
          <th>结果</th>
          <th>通过/总数</th>
          <th>覆盖率</th>
          <th>持续时间</th>
          <th>Git分支</th>
          <th>Git提交</th>
        </tr>
  `;
  
  // 添加每行结果
  results.forEach(result => {
    html += `
      <tr>
        <td>${result.timestamp}</td>
        <td class="${result.success ? 'success' : 'failure'}">${result.success ? '通过' : '失败'}</td>
        <td>${result.testsPassed}/${result.testsPassed + result.testsFailed}</td>
        <td>${result.testCoverage ? result.testCoverage.toFixed(2) + '%' : 'N/A'}</td>
        <td>${result.duration}ms</td>
        <td>${result.gitBranch || 'N/A'}</td>
        <td>${result.gitCommit ? result.gitCommit.substring(0, 7) : 'N/A'}</td>
      </tr>
    `;
  });
  
  html += `
      </table>
    </body>
    </html>
  `;
  
  // 保存报告
  const reportDir = path.resolve(__dirname, '../tests/reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportPath = path.join(reportDir, `${stage}-report.html`);
  fs.writeFileSync(reportPath, html);
  
  console.log(`测试报告已生成: ${reportPath}`);
  return html;
}

/**
 * 比较两次测试结果
 * @param current 当前测试结果
 * @param previous 之前的测试结果
 * @returns 比较结果文本
 */
export function compareTestResults(current: TestResult, previous: TestResult): string {
  let comparison = `## 测试结果比较\n\n`;
  comparison += `- 时间: ${current.timestamp} vs ${previous.timestamp}\n`;
  comparison += `- 结果: ${current.success ? '通过' : '失败'} vs ${previous.success ? '通过' : '失败'}\n`;
  comparison += `- 通过率: ${current.testsPassed}/${current.testsPassed + current.testsFailed} vs ${previous.testsPassed}/${previous.testsPassed + previous.testsFailed}\n`;
  
  if (current.testCoverage && previous.testCoverage) {
    const diff = current.testCoverage - previous.testCoverage;
    comparison += `- 覆盖率: ${current.testCoverage.toFixed(2)}% vs ${previous.testCoverage.toFixed(2)}% (${diff > 0 ? '+' : ''}${diff.toFixed(2)}%)\n`;
  }
  
  comparison += `- 执行时间: ${current.duration}ms vs ${previous.duration}ms (${current.duration - previous.duration}ms)\n`;
  
  return comparison;
}

// 导出默认对象
export default {
  saveTestResult,
  getLatestTestResult,
  getAllTestResults,
  generateTestReport,
  compareTestResults,
  TestStage
}; 