import fs from 'fs';
import path from 'path';
import readline from 'readline';

interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  relatedTests: string[];
  createdAt: string;
  updatedAt: string;
  resolution?: string;
}

class IssueManager {
  private issuesDir: string;
  private issuesFile: string;
  private categoriesFile: string;
  private issues: Issue[] = [];
  private categories: Set<string> = new Set();

  constructor() {
    this.issuesDir = path.resolve(process.cwd(), 'tests/actions');
    this.issuesFile = path.join(this.issuesDir, 'issues.json');
    this.categoriesFile = path.join(this.issuesDir, 'categories.json');
    this.loadData();
  }

  /**
   * 加载数据
   */
  private loadData(): void {
    if (fs.existsSync(this.issuesFile)) {
      this.issues = JSON.parse(fs.readFileSync(this.issuesFile, 'utf-8'));
    }

    if (fs.existsSync(this.categoriesFile)) {
      const categories = JSON.parse(fs.readFileSync(this.categoriesFile, 'utf-8'));
      this.categories = new Set(categories);
    }
  }

  /**
   * 保存数据
   */
  private saveData(): void {
    fs.writeFileSync(this.issuesFile, JSON.stringify(this.issues, null, 2));
    fs.writeFileSync(this.categoriesFile, JSON.stringify([...this.categories], null, 2));
  }

  /**
   * 创建新问题
   */
  public createIssue(
    title: string,
    description: string,
    priority: Issue['priority'],
    category: string,
    relatedTests: string[]
  ): Issue {
    const issue: Issue = {
      id: `ISSUE-${Date.now()}`,
      title,
      description,
      status: 'open',
      priority,
      category,
      relatedTests,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.issues.push(issue);
    this.categories.add(category);
    this.saveData();

    console.log(`已创建问题: ${issue.id}`);
    return issue;
  }

  /**
   * 更新问题状态
   */
  public updateIssueStatus(id: string, status: Issue['status'], resolution?: string): void {
    const issue = this.issues.find(i => i.id === id);
    if (!issue) {
      console.error(`未找到问题: ${id}`);
      return;
    }

    issue.status = status;
    issue.updatedAt = new Date().toISOString();
    if (resolution) {
      issue.resolution = resolution;
    }

    this.saveData();
    console.log(`已更新问题状态: ${id} -> ${status}`);
  }

  /**
   * 显示问题列表
   */
  public listIssues(filter?: {
    status?: Issue['status'],
    priority?: Issue['priority'],
    category?: string
  }): void {
    let filteredIssues = this.issues;

    if (filter) {
      filteredIssues = this.issues.filter(issue => {
        if (filter.status && issue.status !== filter.status) return false;
        if (filter.priority && issue.priority !== filter.priority) return false;
        if (filter.category && issue.category !== filter.category) return false;
        return true;
      });
    }

    if (filteredIssues.length === 0) {
      console.log('没有找到符合条件的问题。');
      return;
    }

    console.log('\n问题列表:');
    console.log('=================');
    filteredIssues.forEach(issue => {
      console.log(`ID: ${issue.id}`);
      console.log(`标题: ${issue.title}`);
      console.log(`状态: ${issue.status}`);
      console.log(`优先级: ${issue.priority}`);
      console.log(`分类: ${issue.category}`);
      console.log(`创建时间: ${new Date(issue.createdAt).toLocaleString()}`);
      console.log(`更新时间: ${new Date(issue.updatedAt).toLocaleString()}`);
      if (issue.resolution) {
        console.log(`解决方案: ${issue.resolution}`);
      }
      console.log('----------------');
    });
  }

  /**
   * 生成问题报告
   */
  public generateReport(): void {
    const reportPath = path.join(this.issuesDir, 'issue-report.html');
    const stats = {
      total: this.issues.length,
      open: this.issues.filter(i => i.status === 'open').length,
      inProgress: this.issues.filter(i => i.status === 'in-progress').length,
      resolved: this.issues.filter(i => i.status === 'resolved').length,
      closed: this.issues.filter(i => i.status === 'closed').length,
      critical: this.issues.filter(i => i.priority === 'critical').length
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>问题跟踪报告</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .stats { background: #f5f5f5; padding: 20px; border-radius: 5px; }
    .issue { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
    .open { border-left: 4px solid #f44336; }
    .in-progress { border-left: 4px solid #2196F3; }
    .resolved { border-left: 4px solid #4CAF50; }
    .closed { border-left: 4px solid #9E9E9E; }
    .critical { background-color: #ffebee; }
    .chart { margin: 20px 0; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>问题跟踪报告</h1>
  
  <div class="stats">
    <h2>统计</h2>
    <p>总问题数: ${stats.total}</p>
    <p>待处理: ${stats.open}</p>
    <p>处理中: ${stats.inProgress}</p>
    <p>已解决: ${stats.resolved}</p>
    <p>已关闭: ${stats.closed}</p>
    <p>严重问题: ${stats.critical}</p>
  </div>

  <div class="chart">
    <canvas id="statusChart"></canvas>
  </div>

  <div class="issues">
    <h2>问题列表</h2>
    ${this.issues.map(issue => `
      <div class="issue ${issue.status} ${issue.priority === 'critical' ? 'critical' : ''}">
        <h3>${issue.title}</h3>
        <p><strong>ID:</strong> ${issue.id}</p>
        <p><strong>状态:</strong> ${issue.status}</p>
        <p><strong>优先级:</strong> ${issue.priority}</p>
        <p><strong>分类:</strong> ${issue.category}</p>
        <p><strong>描述:</strong> ${issue.description}</p>
        <p><strong>创建时间:</strong> ${new Date(issue.createdAt).toLocaleString()}</p>
        <p><strong>更新时间:</strong> ${new Date(issue.updatedAt).toLocaleString()}</p>
        ${issue.resolution ? `<p><strong>解决方案:</strong> ${issue.resolution}</p>` : ''}
      </div>
    `).join('')}
  </div>

  <script>
    const ctx = document.getElementById('statusChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['待处理', '处理中', '已解决', '已关闭'],
        datasets: [{
          label: '问题状态统计',
          data: [${stats.open}, ${stats.inProgress}, ${stats.resolved}, ${stats.closed}],
          backgroundColor: ['#f44336', '#2196F3', '#4CAF50', '#9E9E9E']
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  </script>
</body>
</html>
    `;

    fs.writeFileSync(reportPath, htmlContent);
    console.log(`\n已生成问题报告: ${reportPath}`);
  }

  /**
   * 交互式命令行界面
   */
  public async startCLI(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(prompt, resolve);
      });
    };

    while (true) {
      console.log('\n问题跟踪系统');
      console.log('1. 创建新问题');
      console.log('2. 更新问题状态');
      console.log('3. 查看问题列表');
      console.log('4. 生成问题报告');
      console.log('5. 退出');

      const choice = await question('请选择操作 (1-5): ');

      switch (choice) {
        case '1': {
          const title = await question('问题标题: ');
          const description = await question('问题描述: ');
          const priority = await question('优先级 (low/medium/high/critical): ') as Issue['priority'];
          const category = await question('分类: ');
          const relatedTests = (await question('相关测试 (用逗号分隔): ')).split(',').map(s => s.trim());
          
          this.createIssue(title, description, priority, category, relatedTests);
          break;
        }
        case '2': {
          const id = await question('问题ID: ');
          const status = await question('新状态 (open/in-progress/resolved/closed): ') as Issue['status'];
          const resolution = await question('解决方案 (可选): ');
          
          this.updateIssueStatus(id, status, resolution || undefined);
          break;
        }
        case '3': {
          console.log('\n筛选条件 (直接回车跳过)');
          const status = await question('状态: ') as Issue['status'];
          const priority = await question('优先级: ') as Issue['priority'];
          const category = await question('分类: ');
          
          this.listIssues({
            status: status || undefined,
            priority: priority || undefined,
            category: category || undefined
          });
          break;
        }
        case '4':
          this.generateReport();
          break;
        case '5':
          rl.close();
          return;
        default:
          console.log('无效的选择，请重试。');
      }
    }
  }
}

// 运行问题管理器
const manager = new IssueManager();
manager.startCLI(); 