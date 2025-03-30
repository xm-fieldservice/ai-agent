/**
 * 测试框架前端JS - 实现与API的交互
 */

// API基础URL
const API_BASE_URL = 'http://localhost:3001/api';

// DOM元素缓存
const elements = {
  // 项目选择
  projectSelect: document.getElementById('projectSelect'),
  
  // 统计数据
  totalTests: document.getElementById('totalTests'),
  passedTests: document.getElementById('passedTests'),
  failedTests: document.getElementById('failedTests'),
  
  // 进度条
  progressBar: document.getElementById('progressBar'),
  progressText: document.getElementById('progressText'),
  
  // 标签页内容
  stagesTab: document.getElementById('stagesTab'),
  resultsTab: document.getElementById('resultsTab'),
  issuesTab: document.getElementById('issuesTab'),
  
  // 测试阶段
  stagesTable: document.getElementById('stagesTable'),
  
  // 测试结果
  resultDate: document.getElementById('resultDate'),
  stageFilter: document.getElementById('stageFilter'),
  resultsTable: document.getElementById('resultsTable'),
  
  // 问题追踪
  statusFilter: document.getElementById('statusFilter'),
  issuesTable: document.getElementById('issuesTable')
};

// 初始化应用
async function initApp() {
  await loadTestStages();
  await loadTestResults();
  await loadIssues();
}

// 切换标签页
function switchTab(tabName) {
  // 隐藏所有标签页内容
  elements.stagesTab.classList.add('hidden');
  elements.resultsTab.classList.add('hidden');
  elements.issuesTab.classList.add('hidden');
  
  // 移除所有标签按钮的活动状态
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // 显示选中的标签页
  const selectedTab = document.getElementById(`${tabName}Tab`);
  if (selectedTab) {
    selectedTab.classList.remove('hidden');
  }
  
  // 设置按钮活动状态
  const selectedBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => {
    return btn.textContent.includes(tabName === 'stages' ? '测试阶段' : 
                                  tabName === 'results' ? '测试结果' : '问题记录');
  });
  if (selectedBtn) {
    selectedBtn.classList.add('active');
  }
}

// 刷新数据
async function refreshData() {
  await loadTestStages();
  await loadTestResults();
  await loadIssues();
}

// API请求辅助函数
async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}

// 加载测试阶段
async function loadTestStages() {
  try {
    const stages = await apiRequest('/stages');
    if (stages) {
      // 更新阶段表格
      const tbody = elements.stagesTable.querySelector('tbody');
      tbody.innerHTML = Object.entries(stages).map(([id, config]) => `
        <tr>
          <td>${id}</td>
          <td><span class="status-badge status-pending">待运行</span></td>
          <td>-</td>
          <td>
            <button class="btn btn-primary" onclick="runTests('${id}')">运行</button>
          </td>
        </tr>
      `).join('');
      
      // 更新阶段过滤器
      const stageFilter = elements.stageFilter;
      stageFilter.innerHTML = '<option value="all">所有阶段</option>' +
        Object.keys(stages).map(id => `<option value="${id}">${id}</option>`).join('');
    }
  } catch (error) {
    console.error('加载测试阶段失败:', error);
    alert('加载测试阶段失败，请检查API服务是否正常运行');
  }
}

// 加载测试结果
async function loadTestResults() {
  try {
    const date = elements.resultDate.value;
    const stage = elements.stageFilter.value;
    const query = new URLSearchParams();
    if (date) query.set('date', date);
    if (stage !== 'all') query.set('stage', stage);
    
    const results = await apiRequest(`/results?${query}`);
    if (Array.isArray(results)) {
      const tbody = elements.resultsTable.querySelector('tbody');
      tbody.innerHTML = results.map(result => `
        <tr>
          <td>${new Date(result.timestamp).toLocaleString()}</td>
          <td>${result.stage}</td>
          <td>
            <span class="status-badge status-${result.success ? 'pass' : 'fail'}">
              ${result.success ? '通过' : '失败'}
            </span>
          </td>
          <td>${result.duration}ms</td>
          <td>
            <button class="btn btn-secondary" onclick="showTestDetail('${result.id}')">
              查看
            </button>
          </td>
        </tr>
      `).join('');
      
      // 更新统计数据
      const stats = {
        total: results.length,
        passed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      };
      
      elements.totalTests.textContent = stats.total;
      elements.passedTests.textContent = stats.passed;
      elements.failedTests.textContent = stats.failed;
      
      // 更新进度条
      const progress = stats.total > 0 ? (stats.passed / stats.total * 100) : 0;
      elements.progressBar.style.width = `${progress}%`;
      elements.progressText.textContent = `${Math.round(progress)}%`;
    }
  } catch (error) {
    console.error('加载测试结果失败:', error);
  }
}

// 加载问题列表
async function loadIssues() {
  try {
    const status = elements.statusFilter.value;
    const issues = await apiRequest(`/issues${status !== 'all' ? `?status=${status}` : ''}`);
    
    if (Array.isArray(issues)) {
      const tbody = elements.issuesTable.querySelector('tbody');
      tbody.innerHTML = issues.map(issue => `
        <tr>
          <td>${issue.date}</td>
          <td>${issue.stage}</td>
          <td>${issue.title}</td>
          <td>
            <span class="status-badge status-${issue.status === 'fixed' ? 'pass' : 'pending'}">
              ${issue.status === 'fixed' ? '已修复' : '待修复'}
            </span>
          </td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('加载问题列表失败:', error);
  }
}

// 运行测试
async function runAllTests() {
  try {
    const result = await apiRequest('/run', 'POST', { stage: 'all' });
    alert('开始运行所有测试');
    await loadTestStages();
  } catch (error) {
    console.error('运行测试失败:', error);
    alert('运行测试失败，请检查API服务是否正常运行');
  }
}

// 运行特定阶段的测试
async function runTests(stage) {
  try {
    const result = await apiRequest('/run', 'POST', { stage });
    alert(`开始运行 ${stage} 阶段的测试`);
    await loadTestStages();
  } catch (error) {
    console.error('运行测试失败:', error);
    alert('运行测试失败，请检查API服务是否正常运行');
  }
}

// 显示测试详情
async function showTestDetail(id) {
  try {
    const result = await apiRequest(`/results/${id}`);
    alert(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('获取测试详情失败:', error);
  }
}

// 启动应用
document.addEventListener('DOMContentLoaded', initApp); 