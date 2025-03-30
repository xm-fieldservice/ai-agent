import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

interface TestResult {
  file: string;
  success: boolean;
  duration: number;
  output: string;
  error: string;
  timestamp: string;
}

interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageDuration: number;
  startTime: string;
  endTime: string;
}

class ResultViewer {
  private resultsDir: string;
  private summaryFile: string;

  constructor() {
    this.resultsDir = path.resolve(process.cwd(), 'tests/results');
    this.summaryFile = path.join(this.resultsDir, 'summary.json');
  }

  /**
   * 读取所有测试结果
   */
  private readAllResults(): TestResult[] {
    const files = fs.readdirSync(this.resultsDir)
      .filter(file => file.endsWith('.json') && file !== 'summary.json');
    
    return files.map(file => {
      const content = fs.readFileSync(path.join(this.resultsDir, file), 'utf-8');
      return JSON.parse(content) as TestResult;
    });
  }

  /**
   * 生成测试摘要
   */
  private generateSummary(results: TestResult[]): TestSummary {
    const summary: TestSummary = {
      totalTests: results.length,
      passedTests: results.filter(r => r.success).length,
      failedTests: results.filter(r => !r.success).length,
      averageDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      startTime: results.reduce((earliest, r) => 
        r.timestamp < earliest ? r.timestamp : earliest, results[0]?.timestamp),
      endTime: results.reduce((latest, r) => 
        r.timestamp > latest ? r.timestamp : latest, results[0]?.timestamp)
    };

    fs.writeFileSync(this.summaryFile, JSON.stringify(summary, null, 2));
    return summary;
  }

  /**
   * 显示测试结果
   */
  public showResults(): void {
    console.log('正在分析测试结果...\n');

    const results = this.readAllResults();
    if (results.length === 0) {
      console.log('没有找到测试结果。');
      return;
    }

    const summary = this.generateSummary(results);

    // 显示摘要
    console.log('测试结果摘要:');
    console.log('=================');
    console.log(`总测试数: ${summary.totalTests}`);
    console.log(`通过: ${summary.passedTests}`);
    console.log(`失败: ${summary.failedTests}`);
    console.log(`平均耗时: ${summary.averageDuration.toFixed(2)}ms`);
    console.log(`开始时间: ${new Date(summary.startTime).toLocaleString()}`);
    console.log(`结束时间: ${new Date(summary.endTime).toLocaleString()}`);
    console.log('=================\n');

    // 显示失败的测试
    const failedTests = results.filter(r => !r.success);
    if (failedTests.length > 0) {
      console.log('失败的测试:');
      console.log('=================');
      failedTests.forEach(test => {
        console.log(`文件: ${test.file}`);
        console.log(`错误: ${test.error}`);
        console.log('----------------');
      });
    }

    // 生成HTML报告
    this.generateHtmlReport(results, summary);
  }

  /**
   * 生成HTML报告
   */
  private generateHtmlReport(results: TestResult[], summary: TestSummary): void {
    const reportDir = path.join(this.resultsDir, 'report');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir);
    }

    const reportPath = path.join(reportDir, 'report.html');
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>测试结果报告</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; }
    .success { color: green; }
    .failure { color: red; }
    .test-case { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
    .chart { margin: 20px 0; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>测试结果报告</h1>
  
  <div class="summary">
    <h2>摘要</h2>
    <p>总测试数: ${summary.totalTests}</p>
    <p>通过: <span class="success">${summary.passedTests}</span></p>
    <p>失败: <span class="failure">${summary.failedTests}</span></p>
    <p>平均耗时: ${summary.averageDuration.toFixed(2)}ms</p>
    <p>开始时间: ${new Date(summary.startTime).toLocaleString()}</p>
    <p>结束时间: ${new Date(summary.endTime).toLocaleString()}</p>
  </div>

  <div class="chart">
    <canvas id="resultsChart"></canvas>
  </div>

  <div class="test-cases">
    <h2>测试用例详情</h2>
    ${results.map(test => `
      <div class="test-case ${test.success ? 'success' : 'failure'}">
        <h3>${test.file}</h3>
        <p>状态: ${test.success ? '通过' : '失败'}</p>
        <p>耗时: ${test.duration}ms</p>
        ${test.error ? `<p>错误: ${test.error}</p>` : ''}
      </div>
    `).join('')}
  </div>

  <script>
    const ctx = document.getElementById('resultsChart').getContext('2d');
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['通过', '失败'],
        datasets: [{
          data: [${summary.passedTests}, ${summary.failedTests}],
          backgroundColor: ['#4CAF50', '#f44336']
        }]
      }
    });
  </script>
</body>
</html>
    `;

    fs.writeFileSync(reportPath, htmlContent);
    console.log(`\n已生成HTML报告: ${reportPath}`);
    
    // 在默认浏览器中打开报告
    const command = process.platform === 'win32' ? 'start' : 'open';
    exec(`${command} ${reportPath}`);
  }
}

// 运行结果查看器
const viewer = new ResultViewer();
viewer.showResults(); 