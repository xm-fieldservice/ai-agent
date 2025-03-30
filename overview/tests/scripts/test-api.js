/**
 * 测试框架API - 连接UI和测试运行脚本
 */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const http = require('http');
const url = require('url');

// 测试阶段枚举
const TEST_STAGES = {
  CODE: 'code',
  DATABASE: 'database',
  STORAGE: 'storage',
  LLM: 'llm',
  CACHE: 'cache',
  SYSTEM: 'system'
};

// 结果目录
const RESULTS_DIR = path.resolve(__dirname, '../results');
// 问题日志文件
const ISSUES_LOG = path.resolve(__dirname, '../actions/fix-log.md');
// 配置目录
const CONFIG_DIR = path.resolve(__dirname, '../config');
// 项目配置文件
const PROJECTS_CONFIG = path.resolve(CONFIG_DIR, 'projects.json');

// 确保目录存在
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}
if (!fs.existsSync(path.dirname(ISSUES_LOG))) {
  fs.mkdirSync(path.dirname(ISSUES_LOG), { recursive: true });
}
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// 初始化项目配置
if (!fs.existsSync(PROJECTS_CONFIG)) {
  const defaultConfig = {
    projects: {
      default: {
        name: "默认项目",
        testDirectory: "src/tests",
        testPattern: "*.test.ts",
        stages: {
          code: { pattern: "src/**/*.integration.test.ts", priority: "高", enabled: true },
          database: { pattern: "src/**/db.*.test.ts", priority: "高", enabled: true },
          storage: { pattern: "src/**/storage.*.test.ts", priority: "中", enabled: true },
          llm: { pattern: "src/**/llm.*.test.ts", priority: "中", enabled: true },
          cache: { pattern: "src/**/cache.*.test.ts", priority: "低", enabled: true },
          system: { pattern: "src/**/system.*.test.ts", priority: "低", enabled: true }
        }
      }
    },
    currentProject: "default"
  };
  fs.writeFileSync(PROJECTS_CONFIG, JSON.stringify(defaultConfig, null, 2));
}

/**
 * 运行指定阶段的测试
 * @param {string} stage 测试阶段
 * @returns {Promise<object>} 测试结果
 */
function runTests(stage) {
  return new Promise((resolve, reject) => {
    console.log(`运行 ${stage} 测试...`);
    const startTime = Date.now();
    
    // 构建命令
    let cmd = '';
    if (stage === 'all') {
      cmd = 'npx vitest run';
    } else {
      // 获取当前项目配置
      const projectsConfig = JSON.parse(fs.readFileSync(PROJECTS_CONFIG, 'utf-8'));
      const currentProject = projectsConfig.currentProject;
      const projectConfig = projectsConfig.projects[currentProject];
      
      // 获取测试文件模式
      const pattern = projectConfig.stages[stage]?.pattern || '';
      if (!pattern) {
        return reject(new Error(`未找到阶段 ${stage} 的配置`));
      }
      
      cmd = `npx vitest run ${pattern}`;
    }
    
    exec(cmd, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      const success = !error;
      
      // 保存结果
      const result = {
        stage,
        timestamp: new Date().toISOString(),
        success,
        duration,
        output: stdout.substring(0, 1000) + (stdout.length > 1000 ? '...(截断)' : ''),
        error: stderr || (error ? error.message : '')
      };
      
      const fileName = `${stage}_${new Date().toISOString().replace(/:/g, '-')}.json`;
      fs.writeFileSync(path.join(RESULTS_DIR, fileName), JSON.stringify(result, null, 2));
      
      console.log(`测试结果: ${success ? '通过' : '失败'}`);
      console.log(`耗时: ${duration}ms`);
      
      resolve(result);
    });
  });
}

/**
 * 获取测试结果
 * @param {string} stage 可选的测试阶段过滤
 * @param {string} date 可选的日期过滤 (YYYY-MM-DD)
 * @returns {Array<object>} 测试结果列表
 */
function getTestResults(stage, date) {
  try {
    const files = fs.readdirSync(RESULTS_DIR);
    let resultFiles = files.filter(f => f.endsWith('.json'));
    
    // 按阶段过滤
    if (stage && stage !== 'all') {
      resultFiles = resultFiles.filter(f => f.startsWith(stage + '_'));
    }
    
    // 按日期过滤
    if (date) {
      resultFiles = resultFiles.filter(f => {
        const timestamp = f.split('_')[1]?.replace('.json', '').replace(/-/g, ':');
        return timestamp && timestamp.startsWith(date);
      });
    }
    
    // 读取结果
    const results = resultFiles.map(file => {
      try {
        const content = fs.readFileSync(path.join(RESULTS_DIR, file), 'utf-8');
        const result = JSON.parse(content);
        result.id = file.replace('.json', '');
        return result;
      } catch (err) {
        console.error(`读取文件 ${file} 失败:`, err);
        return null;
      }
    }).filter(Boolean);
    
    // 按时间排序（最新的在前）
    results.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    return results;
  } catch (err) {
    console.error('获取测试结果失败:', err);
    return [];
  }
}

/**
 * 获取测试结果详情
 * @param {string} id 测试结果ID
 * @returns {object} 测试结果详情
 */
function getTestResultDetail(id) {
  try {
    const filePath = path.join(RESULTS_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('获取测试结果详情失败:', err);
    return null;
  }
}

/**
 * 获取测试问题列表
 * @param {string} status 可选的状态过滤
 * @returns {Array<object>} 问题列表
 */
function getIssues(status) {
  try {
    if (!fs.existsSync(ISSUES_LOG)) {
      return [];
    }
    
    const content = fs.readFileSync(ISSUES_LOG, 'utf-8');
    const issues = [];
    let currentIssue = null;
    
    // 简单的Markdown解析来提取问题
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 新问题的开始
      if (line.startsWith('## ')) {
        if (currentIssue) {
          issues.push(currentIssue);
        }
        
        const dateStageParts = line.substring(3).split(' - ');
        currentIssue = {
          id: `I${issues.length + 1}`.padStart(4, '0'),
          date: dateStageParts[0] || '',
          stage: dateStageParts[1] || '',
          title: '',
          description: '',
          cause: '',
          fixes: [],
          status: 'pending'
        };
      } 
      // 问题标题
      else if (line.startsWith('### 问题') && currentIssue) {
        currentIssue.title = line.replace(/^### 问题[0-9]*:?\s*/, '');
      }
      // 问题描述
      else if (line.startsWith('**描述**:') && currentIssue) {
        currentIssue.description = line.replace(/^\*\*描述\*\*:\s*/, '');
      }
      // 问题原因
      else if (line.startsWith('**原因**:') && currentIssue) {
        currentIssue.cause = line.replace(/^\*\*原因\*\*:\s*/, '');
      }
      // 修复步骤开始
      else if (line.startsWith('**修复**:') && currentIssue) {
        let j = i + 1;
        while (j < lines.length && lines[j].trim().match(/^[0-9]+\.\s/)) {
          currentIssue.fixes.push(lines[j].trim().replace(/^[0-9]+\.\s/, ''));
          j++;
        }
        i = j - 1; // 调整循环索引
      }
      // 状态
      else if (line.startsWith('**状态**:') && currentIssue) {
        const statusText = line.replace(/^\*\*状态\*\*:\s*/, '');
        currentIssue.status = statusText.includes('已修复') ? 'fixed' : 'pending';
      }
    }
    
    // 添加最后一个问题
    if (currentIssue) {
      issues.push(currentIssue);
    }
    
    // 按状态过滤
    if (status && status !== 'all') {
      return issues.filter(issue => issue.status === status);
    }
    
    return issues;
  } catch (err) {
    console.error('获取问题列表失败:', err);
    return [];
  }
}

/**
 * 添加新问题
 * @param {object} issue 问题信息
 * @returns {boolean} 是否成功
 */
function addIssue(issue) {
  try {
    if (!issue.stage || !issue.title) {
      return false;
    }
    
    const date = new Date().toISOString().split('T')[0];
    let content = '';
    
    if (!fs.existsSync(ISSUES_LOG)) {
      content = '# 问题修复日志\n\n';
    }
    
    content += `## ${date} - ${issue.stage}\n\n`;
    content += `### 问题: ${issue.title}\n\n`;
    content += `**描述**: ${issue.description || '无'}\n\n`;
    content += `**原因**: ${issue.cause || '未知'}\n\n`;
    content += `**修复**:\n`;
    
    if (issue.fixes && issue.fixes.length > 0) {
      issue.fixes.forEach((fix, index) => {
        content += `${index+1}. ${fix}\n`;
      });
    } else {
      content += '暂无修复步骤\n';
    }
    
    content += `\n**状态**: ${issue.status === 'fixed' ? '已修复' : '待修复'}\n\n`;
    content += `---\n\n`;
    
    fs.appendFileSync(ISSUES_LOG, content);
    return true;
  } catch (err) {
    console.error('添加问题失败:', err);
    return false;
  }
}

/**
 * 获取测试计划列表
 * @returns {Array<object>} 测试计划列表
 */
function getTestPlans() {
  try {
    const projectsConfig = JSON.parse(fs.readFileSync(PROJECTS_CONFIG, 'utf-8'));
    const currentProject = projectsConfig.currentProject;
    const projectConfig = projectsConfig.projects[currentProject];
    
    // 获取最新测试结果
    const results = getTestResults();
    const resultMap = {};
    results.forEach(result => {
      if (!resultMap[result.stage] || new Date(result.timestamp) > new Date(resultMap[result.stage].timestamp)) {
        resultMap[result.stage] = result;
      }
    });
    
    // 构建测试计划列表
    const plans = [];
    let id = 1;
    
    for (const [stage, config] of Object.entries(projectConfig.stages)) {
      if (!config.enabled) continue;
      
      plans.push({
        id: `T${id.toString().padStart(3, '0')}`,
        stage,
        name: `${stage}阶段测试`,
        priority: config.priority,
        status: resultMap[stage] ? (resultMap[stage].success ? 'pass' : 'fail') : 'unknown',
        lastRun: resultMap[stage] ? resultMap[stage].timestamp : null
      });
      
      id++;
    }
    
    return plans;
  } catch (err) {
    console.error('获取测试计划失败:', err);
    return [];
  }
}

/**
 * 获取测试统计信息
 * @returns {object} 统计信息
 */
function getTestStats() {
  try {
    // 获取最新测试结果
    const results = getTestResults();
    const resultMap = {};
    
    // 只保留每个阶段的最新结果
    results.forEach(result => {
      if (!resultMap[result.stage] || new Date(result.timestamp) > new Date(resultMap[result.stage].timestamp)) {
        resultMap[result.stage] = result;
      }
    });
    
    // 计算统计数据
    const latestResults = Object.values(resultMap);
    const totalTests = latestResults.length;
    const passedTests = latestResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    // 计算实施进度
    const projectsConfig = JSON.parse(fs.readFileSync(PROJECTS_CONFIG, 'utf-8'));
    const currentProject = projectsConfig.currentProject;
    const projectConfig = projectsConfig.projects[currentProject];
    
    const totalStages = Object.keys(projectConfig.stages).filter(s => projectConfig.stages[s].enabled).length;
    const implementedStages = latestResults.length;
    const implementationProgress = Math.round((implementedStages / totalStages) * 100);
    
    // 简单计算覆盖率 (实际项目中应该从测试覆盖率报告中获取)
    const coverageProgress = Math.round((passedTests / totalTests) * 100) || 0;
    
    return {
      totalTests,
      passedTests,
      failedTests,
      implementationProgress,
      coverageProgress
    };
  } catch (err) {
    console.error('获取测试统计信息失败:', err);
    return {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      implementationProgress: 0,
      coverageProgress: 0
    };
  }
}

/**
 * 获取项目列表
 * @returns {Array<object>} 项目列表
 */
function getProjects() {
  try {
    const projectsConfig = JSON.parse(fs.readFileSync(PROJECTS_CONFIG, 'utf-8'));
    return Object.keys(projectsConfig.projects).map(key => ({
      id: key,
      name: projectsConfig.projects[key].name,
      current: key === projectsConfig.currentProject
    }));
  } catch (err) {
    console.error('获取项目列表失败:', err);
    return [];
  }
}

/**
 * 切换当前项目
 * @param {string} projectId 项目ID
 * @returns {boolean} 是否成功
 */
function switchProject(projectId) {
  try {
    const projectsConfig = JSON.parse(fs.readFileSync(PROJECTS_CONFIG, 'utf-8'));
    
    if (!projectsConfig.projects[projectId]) {
      return false;
    }
    
    projectsConfig.currentProject = projectId;
    fs.writeFileSync(PROJECTS_CONFIG, JSON.stringify(projectsConfig, null, 2));
    return true;
  } catch (err) {
    console.error('切换项目失败:', err);
    return false;
  }
}

/**
 * 创建新项目
 * @param {object} project 项目信息
 * @returns {string} 新项目ID，失败则返回空字符串
 */
function createProject(project) {
  try {
    if (!project.name) {
      return '';
    }
    
    const projectsConfig = JSON.parse(fs.readFileSync(PROJECTS_CONFIG, 'utf-8'));
    
    // 生成唯一ID
    const projectId = `project_${Date.now()}`;
    
    projectsConfig.projects[projectId] = {
      name: project.name,
      testDirectory: project.testDirectory || "src/tests",
      testPattern: project.testPattern || "*.test.ts",
      stages: {
        code: { pattern: "src/**/*.integration.test.ts", priority: "高", enabled: true },
        database: { pattern: "src/**/db.*.test.ts", priority: "高", enabled: true },
        storage: { pattern: "src/**/storage.*.test.ts", priority: "中", enabled: true },
        llm: { pattern: "src/**/llm.*.test.ts", priority: "中", enabled: true },
        cache: { pattern: "src/**/cache.*.test.ts", priority: "低", enabled: true },
        system: { pattern: "src/**/system.*.test.ts", priority: "低", enabled: true }
      }
    };
    
    fs.writeFileSync(PROJECTS_CONFIG, JSON.stringify(projectsConfig, null, 2));
    return projectId;
  } catch (err) {
    console.error('创建项目失败:', err);
    return '';
  }
}

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // 解析 URL
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  try {
    // 路由处理
    if (pathname === '/api/stages') {
      // 获取测试阶段
      const projectsConfig = JSON.parse(fs.readFileSync(PROJECTS_CONFIG, 'utf-8'));
      const currentProject = projectsConfig.currentProject;
      const stages = projectsConfig.projects[currentProject].stages;
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stages));
    }
    else if (pathname === '/api/results') {
      // 获取测试结果列表
      const { stage, date } = parsedUrl.query;
      const results = getTestResults(stage, date);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
    }
    else if (pathname.startsWith('/api/results/')) {
      // 获取测试结果详情
      const id = pathname.replace('/api/results/', '');
      const result = getTestResultDetail(id);
      
      if (result) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    }
    else if (pathname === '/api/issues') {
      // 获取问题列表
      const { status } = parsedUrl.query;
      const issues = getIssues(status);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(issues));
    }
    else if (pathname === '/api/run' && req.method === 'POST') {
      // 运行测试
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { stage } = JSON.parse(body);
          const result = await runTests(stage);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    }
    else {
      res.writeHead(404);
      res.end('Not Found');
    }
  } catch (error) {
    console.error('请求处理失败:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

// 启动服务器
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`API 服务器运行在 http://localhost:${PORT}`);
});

// 导出API函数供其他脚本使用
module.exports = {
  runTests,
  getTestResults,
  getTestResultDetail,
  getIssues,
  addIssue,
  getTestPlans,
  getTestStats,
  getProjects,
  switchProject,
  createProject
}; 