const { CodeIndexer } = require('./codeIndexer');
const path = require('path');
const fs = require('fs');
const yaml = require('yaml'); // 添加这一行来导入yaml模块

// 加载配置
const configPath = path.join(__dirname, '../config/config.yaml');
const config = yaml.parse(fs.readFileSync(configPath, 'utf8')); // 修改YAML为yaml

// 初始化代码索引器
async function initCodeIndexing() {
  const indexer = new CodeIndexer(config.codeIndexing.scanOptions);
  const targetDir = path.resolve(__dirname, '../');
  await indexer.scanDirectory(targetDir);
  console.log('代码索引完成:', indexer.getIndex());
}

initCodeIndexing().catch(console.error);