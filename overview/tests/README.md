# 可视化测试框架使用指南

这是一个针对不同项目的可视化测试框架工具，支持测试执行、结果查看和问题追踪等功能。

## 特点

- 多项目支持：可同时管理多个项目的测试
- 阶段化测试：支持代码、数据库、存储、LLM、缓存和系统等多个测试阶段
- 可视化界面：清晰直观的仪表盘，显示测试进度和结果
- 图表分析：通过图表展示测试趋势和覆盖率
- 问题追踪：记录和管理测试过程中发现的问题

## 安装

1. 确保已安装依赖

```bash
npm install ts-node vitest open --save-dev
```

2. 配置 package.json

在 package.json 中添加以下脚本：

```json
"scripts": {
  "test:dashboard": "node tests/start-test-dashboard.js",
  "test:quick": "ts-node tests/scripts/run-basic-tests.ts",
  "test:quick:code": "ts-node tests/scripts/run-basic-tests.ts code",
  "test:quick:db": "ts-node tests/scripts/run-basic-tests.ts database",
  "test:quick:storage": "ts-node tests/scripts/run-basic-tests.ts storage",
  "test:quick:llm": "ts-node tests/scripts/run-basic-tests.ts llm",
  "test:quick:cache": "ts-node tests/scripts/run-basic-tests.ts cache",
  "test:quick:system": "ts-node tests/scripts/run-basic-tests.ts system"
}
```

## 启动测试框架

```bash
npm run test:dashboard
```

这将启动两个服务器：
- API服务器 (端口 3001)：提供测试运行和数据访问功能
- UI服务器 (端口 3000)：提供Web界面

## 使用指南

### 首页仪表盘

仪表盘显示测试总览、实施进度和测试覆盖率，以及阶段进度和趋势图表。

### 测试计划

1. 选择测试阶段（代码、数据库等）
2. 点击"运行测试"按钮执行所选阶段的测试
3. 也可以对单个测试点击"运行"按钮

### 测试结果

1. 查看已执行的测试结果
2. 可按日期筛选结果
3. 点击"查看"按钮查看详细结果和输出

### 问题追踪

1. 点击"新建问题"记录测试中发现的问题
2. 填写问题详情，包括阶段、标题、描述、原因和修复步骤
3. 问题列表可按状态（待修复/已修复）筛选

### 多项目管理

1. 使用顶部的项目选择器切换不同项目
2. 选择"+ 新建项目"创建新的测试项目

## 目录结构

```
tests/
├── ui/                 # 前端界面文件
│   ├── dashboard.html  # 主页面
│   ├── main.js         # 前端逻辑
│   ├── styles.css      # 样式表
│   └── 404.html        # 404错误页
├── scripts/            # 脚本文件
│   ├── test-api.js     # API服务器
│   └── run-basic-tests.ts  # 测试运行脚本
├── results/            # 测试结果存储
├── actions/            # 问题记录
│   └── fix-log.md      # 问题修复日志
├── config/             # 配置文件
│   └── projects.json   # 项目配置
└── start-test-dashboard.js  # 启动脚本
```

## 定制化

### 添加新测试阶段

1. 修改 `tests/scripts/test-api.js` 中的 `TEST_STAGES` 常量
2. 更新项目配置中的阶段定义

### 修改测试模式

编辑 `tests/config/projects.json` 中的项目配置，修改各阶段的 `pattern` 字段。

## 故障排除

1. **启动失败**: 检查端口 3000 和 3001 是否被占用
2. **测试无法运行**: 确认已安装 vitest 和 ts-node
3. **测试结果不加载**: 检查 API 服务器是否正常运行

---

如有其他问题，请查看相关代码文件或提交问题。 