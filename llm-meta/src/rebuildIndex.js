const { CodeIndexer } = require('./codeIndexer');
const path = require('path');
const fs = require('fs');
const yaml = require('yaml');

// 确保yaml模块已安装
try {
  require.resolve('yaml');
} catch (e) {
  console.error('yaml模块未安装，正在安装...');
  require('child_process').execSync('npm install yaml', { stdio: 'inherit' });
  console.log('yaml模块安装完成');
}

// 加载配置
let config;
const configPath = path.join(__dirname, '../config/config.yaml');

try {
  if (fs.existsSync(configPath)) {
    const configFile = fs.readFileSync(configPath, 'utf8');
    config = yaml.parse(configFile);
    console.log('配置文件加载成功');
  } else {
    throw new Error('配置文件不存在');
  }
} catch (error) {
  console.error('配置文件加载失败:', error.message);
  // 使用默认配置
  config = {
    codeIndexing: {
      scanOptions: {
        ignoreDirs: [".git", "node_modules", "dist", "build"],
        fileExtensions: [".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".html", ".css"]
      }
    }
  };
  console.log('使用默认配置');
}

// 确保配置中有codeIndexing部分
if (!config.codeIndexing) {
  config.codeIndexing = {
    scanOptions: {
      ignoreDirs: [".git", "node_modules", "dist", "build"],
      fileExtensions: [".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".html", ".css"]
    }
  };
}

// 初始化代码索引器
async function rebuildIndex() {
  console.log('开始重新构建工作区索引...');
  
  try {
    const indexer = new CodeIndexer(config.codeIndexing.scanOptions);
    const targetDir = path.resolve(__dirname, '../');
    console.log(`扫描目录: ${targetDir}`);
    
    await indexer.scanDirectory(targetDir);
    console.log('代码扫描完成!');
    
    // 保存索引结果
    const indexDir = path.join(__dirname, '../.index');
    const indexPath = path.join(indexDir, 'codeIndex.json');
    
    // 确保索引目录存在
    if (!fs.existsSync(indexDir)) {
      fs.mkdirSync(indexDir, { recursive: true });
    }
    
    indexer.saveIndex(indexPath);
    
    // 创建一个标记文件表示索引已完成
    fs.writeFileSync(path.join(indexDir, 'index-complete'), new Date().toISOString());
    
    console.log('工作区索引重建成功!');
    return true;
  } catch (error) {
    console.error('索引构建失败:', error);
    return false;
  }
}

// 运行索引重建
rebuildIndex()
  .then(success => {
    if (success) {
      console.log('索引重建完成，您现在可以使用代码索引功能了。');
    } else {
      console.log('索引重建失败，请检查错误信息并重试。');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('发生未知错误:', error);
    process.exit(1);
  });