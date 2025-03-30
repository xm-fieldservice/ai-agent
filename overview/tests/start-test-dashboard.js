/**
 * 测试框架仪表盘启动脚本
 */
const path = require('path');
const fs = require('fs');
const http = require('http');
const open = require('open');

// 启动API服务器
require('./scripts/test-api');

// 创建简单的静态文件服务器
const server = http.createServer((req, res) => {
  // 处理路径
  let filePath = req.url;
  if (filePath === '/' || filePath === '/index.html') {
    filePath = '/dashboard.html';
  }
  
  // 映射到UI目录
  filePath = path.join(__dirname, 'ui', filePath);
  
  // 获取文件扩展名
  const extname = String(path.extname(filePath)).toLowerCase();
  
  // MIME类型映射
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  
  // 设置内容类型
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  // 读取文件
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // 文件不存在
        fs.readFile(path.join(__dirname, 'ui', '404.html'), (error, content) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        // 服务器错误
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // 返回文件内容
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// 启动静态文件服务器
const UI_PORT = 3000;
server.listen(UI_PORT, () => {
  console.log(`测试框架仪表盘运行在 http://localhost:${UI_PORT}`);
  
  // 尝试自动打开浏览器
  try {
    open(`http://localhost:${UI_PORT}`);
  } catch (error) {
    console.log('请手动打开浏览器访问上述地址');
  }
});

// 处理退出信号
process.on('SIGINT', () => {
  console.log('正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
}); 