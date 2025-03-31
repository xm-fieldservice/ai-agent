# AI-Agent 移动端内务系统备份清单

## 备份日期: 2025-03-31

## 备份文件列表

1. 移动端代码备份：`/var/www/ai-agent-mobile-backup-20250331.tar.gz`
2. 后端服务代码备份：`/var/www/ai-agent-server-backup-20250331.tar.gz`
3. Nginx配置备份：`/var/backups/nginx-config-backup-20250331.tar.gz`

## 服务器信息

- 服务器IP: 121.43.126.173
- 移动端目录: `/var/www/ai-agent/mobile`
- 后端服务目录: `/var/www/ai-agent/server`
- Nginx配置: `/etc/nginx/sites-available/internal-system`

## 部署信息

### 移动端 PWA

- 构建工具: Vite
- 技术栈: Vue 3 + TypeScript + Vant UI
- 部署目录: `/var/www/ai-agent/mobile/dist`
- 访问地址: `http://121.43.126.173`

### 后端 API

- 技术栈: Python + Flask
- 启动命令: `pm2 start main.py --name ai-agent-server --interpreter=python3`
- API地址: `http://121.43.126.173/api`

## 恢复步骤

1. 恢复移动端代码:
   ```bash
   sudo tar -xzvf /var/www/ai-agent-mobile-backup-*.tar.gz -C /var/www/
   cd /var/www/ai-agent/mobile
   npm install
   npm run build
   sudo chown -R www-data:www-data dist/
   ```

2. 恢复后端服务:
   ```bash
   sudo tar -xzvf /var/www/ai-agent-server-backup-*.tar.gz -C /var/www/
   cd /var/www/ai-agent/server
   pm2 start main.py --name ai-agent-server --interpreter=python3
   ```

3. 恢复Nginx配置:
   ```bash
   sudo tar -xzvf /var/backups/nginx-config-backup-*.tar.gz -C /
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 注意事项

1. 移动端PWA使用了Sass，构建过程中可能会有关于Sass语法的警告
2. 静态资源已配置适当的缓存控制
3. ServiceWorker用于PWA功能，已配置适当的缓存策略
4. 后端API使用pm2管理，确保python环境已安装所需依赖

## 测试结果

移动端适配测试已通过，包括以下功能:
- 键盘测试
- 手势测试
- 安全区域测试
- 滚动测试
- 设备信息

## 下一步计划

1. 完善业务功能
2. 优化UI/UX
3. 增强离线功能
4. 增加单元测试覆盖率 