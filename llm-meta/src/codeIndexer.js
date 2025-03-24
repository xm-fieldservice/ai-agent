const fs = require('fs');
const path = require('path');

class CodeIndexer {
  constructor(config) {
    this.config = config;
    this.index = {};
  }

  async scanDirectory(dirPath) {
    const files = await fs.promises.readdir(dirPath);
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stats = await fs.promises.stat(fullPath);
      if (stats.isDirectory()) {
        if (!this.config.ignoreDirs.includes(file)) {
          await this.scanDirectory(fullPath);
        }
      } else if (stats.isFile()) {
        const ext = path.extname(file);
        if (this.config.fileExtensions.includes(ext)) {
          await this.indexFile(fullPath);
        }
      }
    }
  }

  async indexFile(filePath) {
    const content = await fs.promises.readFile(filePath, 'utf8');
    this.index[filePath] = content;
  }

  getIndex() {
    return this.index;
  }
}

module.exports = { CodeIndexer };