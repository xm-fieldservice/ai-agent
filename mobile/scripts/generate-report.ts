/**
 * 测试报告生成器
 * 生成所有测试阶段的综合报告
 */

import fs from 'fs';
import path from 'path';
import { TestStage, getAllTestResults, generateTestReport } from './test-utils';

/**
 * 生成综合测试报告
 */
async function generateCompleteReport() {
  console.log('生成综合测试报告...');
  
  // 确保目录存在
  const reportDir = path.resolve(__dirname, '../tests/reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  // 生成各阶段报告
  const stages = Object.values(TestStage);
  for (const stage of stages) {
    generateTestReport(stage);
  }
  
  // 生成综合报告
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>系统集成测试报告</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .success { color: green; }
        .failure { color: red; }
        .pending { color: orange; }
        .summary { margin-bottom: 20px; }
        .stage-link { margin-right: 10px; }
        h2 { margin-top: 30px; }
        .progress-container { 
          height: 20px; 
          background-color: #f1f1f1; 
          border-radius: 4px; 
          margin-bottom: 10px; 
        }
        .progress-bar { 
          height: 100%; 
          background-color: #4CAF50; 
          border-radius: 4px; 
          transition: width 0.5s;
        }
      </style>
    </head>
    <body>
      <h1>系统集成测试报告</h1>
      <p>生成时间: ${new Date().toLocaleString()}</p>
      
      <div class="summary">
        <h2>总体进度</h2>
  `;
  
  // 添加总体进度
  const stageResults = stages.map(stage => {
    const results = getAllTestResults(stage);
    const latestResult = results.length > 0 ? results[0] : null;
    return {
      stage,
      status: latestResult ? (latestResult.success ? 'success' : 'failure') : 'pending',
      passRate: latestResult 
        ? (latestResult.testsPassed / (latestResult.testsPassed + latestResult.testsFailed) * 100).toFixed(2)
        : '0',
      latestRun: latestResult ? latestResult.timestamp : '尚未运行'
    };
  });
  
  const completedStages = stageResults.filter(r => r.status === 'success').length;
  const percentage = (completedStages / stages.length * 100).toFixed(2);
  
  html += `
        <div class="progress-container">
          <div class="progress-bar" style="width: ${percentage}%"></div>
        </div>
        <p>完成度: ${percentage}% (${completedStages}/${stages.length})</p>
        
        <h2>各阶段状态</h2>
        <table>
          <tr>
            <th>阶段</th>
            <th>状态</th>
            <th>通过率</th>
            <th>最近运行时间</th>
            <th>操作</th>
          </tr>
  `;
  
  // 添加每个阶段的状态
  stageResults.forEach(result => {
    html += `
      <tr>
        <td>${result.stage}</td>
        <td class="${result.status}">
          ${result.status === 'success' ? '通过' : (result.status === 'failure' ? '失败' : '未运行')}
        </td>
        <td>${result.passRate}%</td>
        <td>${result.latestRun}</td>
        <td>
          <a href="./${result.stage}-report.html" class="stage-link">查看详情</a>
        </td>
      </tr>
    `;
  });
  
  html += `
        </table>
      </div>
      
      <h2>测试覆盖率</h2>
  `;
  
  // 添加测试覆盖率信息
  try {
    // 尝试读取覆盖率报告
    const coveragePath = path.resolve(__dirname, '../coverage/coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
      
      html += `
        <table>
          <tr>
            <th>文件类型</th>
            <th>语句覆盖率</th>
            <th>分支覆盖率</th>
            <th>函数覆盖率</th>
            <th>行覆盖率</th>
          </tr>
          <tr>
            <td>总体</td>
            <td>${coverageData.total.statements.pct}%</td>
            <td>${coverageData.total.branches.pct}%</td>
            <td>${coverageData.total.functions.pct}%</td>
            <td>${coverageData.total.lines.pct}%</td>
          </tr>
        </table>
      `;
    } else {
      html += `<p>尚未生成覆盖率报告</p>`;
    }
  } catch (error) {
    html += `<p>读取覆盖率报告出错: ${error}</p>`;
  }
  
  // 添加最近测试结果
  html += `
      <h2>最近测试结果</h2>
  `;
  
  stages.forEach(stage => {
    const results = getAllTestResults(stage);
    if (results.length > 0) {
      const latestResult = results[0];
      html += `
        <h3>${stage}</h3>
        <ul>
          <li>测试时间: ${latestResult.timestamp}</li>
          <li>结果: <span class="${latestResult.success ? 'success' : 'failure'}">${latestResult.success ? '通过' : '失败'}</span></li>
          <li>通过率: ${latestResult.testsPassed}/${latestResult.testsPassed + latestResult.testsFailed}</li>
          <li>覆盖率: ${latestResult.testCoverage ? latestResult.testCoverage.toFixed(2) + '%' : 'N/A'}</li>
          <li>Git分支: ${latestResult.gitBranch || 'N/A'}</li>
          <li>Git提交: ${latestResult.gitCommit ? latestResult.gitCommit.substring(0, 7) : 'N/A'}</li>
        </ul>
      `;
    }
  });
  
  html += `
    </body>
    </html>
  `;
  
  // 写入报告文件
  const reportPath = path.join(reportDir, 'complete-report.html');
  fs.writeFileSync(reportPath, html);
  
  console.log(`综合测试报告已生成: ${reportPath}`);
}

// 执行报告生成
generateCompleteReport().catch(error => {
  console.error('生成报告失败:', error);
  process.exit(1);
}); 