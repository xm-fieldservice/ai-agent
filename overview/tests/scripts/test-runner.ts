/**
 * 测试运行器
 */
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

// 测试结果类型
interface TestResult {
  file: string;
  success: boolean;
  duration: number;
  output: string;
  error: string;
  timestamp: string;
}

// 配置类型
interface TestConfig {
  testDirectories: string[];
  reporters: string[];
  timeout: number;
  retries: number;
}

// 测试配置
const CONFIG_FILE = path.resolve(process.cwd(), 'tests/config/test-config.json');
const RESULTS_DIR = path.resolve(process.cwd(), 'tests/results');

// 确保结果目录存在
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// 读取配置
let config: TestConfig;
try {
  config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
} catch (error) {
  console.error('无法读取配置文件:', error);
  process.exit(1);
}

/**
 * 运行单个测试文件
 */
function runTest(testFile: string): Promise<TestResult> {
  return new Promise((resolve, reject) => {
    console.log(`\n运行测试: ${testFile}`);
    const startTime = Date.now();

    exec(`npx vitest run ${testFile}`, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        file: testFile,
        success: !error,
        duration,
        output: stdout,
        error: stderr,
        timestamp: new Date().toISOString()
      };

      // 保存测试结果
      const resultFile = path.join(
        RESULTS_DIR,
        `${path.basename(testFile, '.ts')}_${Date.now()}.json`
      );
      fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));

      if (error) {
        console.log('❌ 测试失败');
        console.error(stderr);
      } else {
        console.log('✅ 测试通过');
      }
      console.log(`耗时: ${duration}ms`);
      
      resolve(result);
    });
  });
}

/**
 * 查找测试文件
 */
function findTestFiles(): string[] {
  const testFiles: string[] = [];
  
  function searchDir(dir: string) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        searchDir(fullPath);
      } else if (file.endsWith('.test.ts')) {
        testFiles.push(fullPath);
      }
    }
  }

  // 搜索所有测试目录
  config.testDirectories.forEach((dir: string) => {
    if (fs.existsSync(dir)) {
      searchDir(dir);
    }
  });

  return testFiles;
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始运行测试...\n');
  const startTime = Date.now();

  const testFiles = findTestFiles();
  if (testFiles.length === 0) {
    console.log('没有找到测试文件');
    return;
  }

  console.log(`找到 ${testFiles.length} 个测试文件`);
  
  const results: TestResult[] = [];
  for (const file of testFiles) {
    const result = await runTest(file);
    results.push(result);
  }

  const duration = Date.now() - startTime;
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;

  console.log('\n测试运行完成!');
  console.log('------------------');
  console.log(`总计: ${results.length} 个测试`);
  console.log(`通过: ${successful} 个`);
  console.log(`失败: ${failed} 个`);
  console.log(`总耗时: ${duration}ms`);
}

// 运行测试
runAllTests().catch(console.error); 