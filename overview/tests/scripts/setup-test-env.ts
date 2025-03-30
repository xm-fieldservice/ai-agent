/**
 * 测试环境设置脚本
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// 定义需要创建的目录
const directories = [
  'tests/scripts',    // 测试脚本
  'tests/cases',      // 测试用例
  'tests/results',    // 测试结果
  'tests/actions',    // 问题修复记录
  'tests/config'      // 配置文件
];

console.log('开始设置测试环境...\n');

// 创建必要的目录
console.log('1. 创建目录结构:');
directories.forEach(dir => {
  const fullPath = path.resolve(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`   ✓ 创建目录: ${dir}`);
  } else {
    console.log(`   • 目录已存在: ${dir}`);
  }
});

// 创建基础配置文件
console.log('\n2. 创建配置文件:');
const configFile = path.resolve(process.cwd(), 'tests/config/test-config.json');
if (!fs.existsSync(configFile)) {
  const config = {
    testDirectories: [
      'tests/cases/basic',
      'tests/cases/integration',
      'tests/cases/e2e'
    ],
    reporters: [
      'default',
      'json'
    ],
    timeout: 5000,
    retries: 1
  };
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
  console.log('   ✓ 创建测试配置文件: test-config.json');
} else {
  console.log('   • 配置文件已存在: test-config.json');
}

// 检查并安装必要的依赖
console.log('\n3. 检查依赖:');
const requiredDeps = ['vitest', 'ts-node', 'typescript'];
let packageJson;

try {
  packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
} catch (error) {
  console.log('   ✗ 未找到 package.json，将创建新文件');
  packageJson = {
    name: "test-framework",
    version: "1.0.0",
    description: "测试框架",
    scripts: {},
    dependencies: {},
    devDependencies: {}
  };
}

let needsInstall = false;
requiredDeps.forEach(dep => {
  if (!packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]) {
    console.log(`   ! 缺少依赖: ${dep}`);
    needsInstall = true;
  } else {
    console.log(`   • 依赖已安装: ${dep}`);
  }
});

if (needsInstall) {
  console.log('\n正在安装缺失的依赖...');
  execSync('npm install vitest ts-node typescript --save-dev', { stdio: 'inherit' });
}

// 添加测试脚本
console.log('\n4. 添加测试脚本到 package.json:');
const scripts = {
  "test:setup": "ts-node tests/scripts/setup-test-env.ts",
  "test:run": "ts-node tests/scripts/test-runner.ts",
  "test:results": "ts-node tests/scripts/result-viewer.ts",
  "test:issues": "ts-node tests/scripts/issue-manager.ts"
};

let scriptsUpdated = false;
for (const [name, command] of Object.entries(scripts)) {
  if (!packageJson.scripts[name]) {
    packageJson.scripts[name] = command;
    console.log(`   ✓ 添加脚本: ${name}`);
    scriptsUpdated = true;
  } else {
    console.log(`   • 脚本已存在: ${name}`);
  }
}

if (scriptsUpdated) {
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
}

console.log('\n✨ 测试环境设置完成！\n');
console.log('接下来可以：');
console.log('1. 编写测试用例到 tests/cases/ 目录');
console.log('2. 使用 npm run test:run 运行测试');
console.log('3. 使用 npm run test:results 查看测试结果'); 