# 阿里云部署指南

## 前置需求

1. 阿里云账号和相关服务
   - ECS 服务器（建议2核4G以上）
   - RDS MySQL 数据库
   - OSS 对象存储
   - SLB 负载均衡（可选）

2. 域名和证书
   - 已备案的域名
   - SSL 证书（可在阿里云申请免费证书）

## 部署步骤

### 1. ECS 服务器配置

```bash
# 更新系统并安装必要软件
apt update && apt upgrade -y
apt install -y nginx nodejs npm git

# 安装 Node.js v18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 安装 PM2
npm install -g pm2
```

### 2. 项目部署

```bash
# 创建应用目录
mkdir -p /var/www/ai-agent
cd /var/www/ai-agent

# 克隆代码
git clone [你的仓库地址] .

# 安装依赖
npm install --production

# 创建日志目录
mkdir -p /var/log/app
```

### 3. 环境配置

创建生产环境配置文件 `/var/www/ai-agent/.env.production`：

```env
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库配置 (使用RDS连接信息)
DB_HOST=your-rds-host.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_CONNECTION_LIMIT=20
DB_QUEUE_LIMIT=50

# OSS配置 (替代MinIO)
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your_bucket_name
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com

# LLM配置
LLM_API_ENDPOINT=your_llm_endpoint
LLM_API_KEY=your_llm_api_key
LLM_MODEL_NAME=gpt-3.5-turbo
LLM_MAX_TOKENS=2000
LLM_TEMPERATURE=0.7

# 日志配置
LOG_LEVEL=info
LOG_FILE=/var/log/app/app.log
```

### 4. Nginx 配置

创建 Nginx 配置文件 `/etc/nginx/sites-available/ai-agent`：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. 启动服务

```bash
# 使用PM2启动服务
cd /var/www/ai-agent
pm2 start npm --name "ai-agent" -- start

# 设置开机自启
pm2 startup
pm2 save

# 启动Nginx
systemctl start nginx
systemctl enable nginx
```

### 6. 监控配置

```bash
# 配置PM2监控
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# 查看日志
pm2 logs ai-agent
```

## 安全配置

1. 配置阿里云安全组
   - 开放80/443端口
   - 限制SSH访问IP
   - 关闭不必要的端口

2. 系统安全
   ```bash
   # 安装和配置防火墙
   apt install -y ufw
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw allow 22/tcp
   ufw enable
   ```

## 备份策略

1. 数据库备份
   - 使用RDS自动备份功能
   - 设置合适的备份周期和保留时间

2. 文件备份
   - OSS已有多副本机制
   - 定期备份配置文件

## 故障处理

1. 服务异常
   ```bash
   # 检查服务状态
   pm2 status
   pm2 logs ai-agent

   # 重启服务
   pm2 restart ai-agent
   ```

2. 数据库连接问题
   - 检查RDS白名单设置
   - 验证连接字符串
   - 检查账号权限

3. OSS访问问题
   - 验证AccessKey权限
   - 检查Bucket权限设置
   - 确认跨域配置

## 性能优化

1. Node.js 配置
   ```bash
   # 设置Node.js内存限制
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

2. Nginx优化
   ```nginx
   # 在http块中添加
   client_max_body_size 100m;
   keepalive_timeout 65;
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   ```

## 维护指南

1. 日常维护
   ```bash
   # 更新代码
   cd /var/www/ai-agent
   git pull
   npm install --production
   pm2 restart ai-agent

   # 检查日志
   tail -f /var/log/app/app.log
   ```

2. 性能监控
   ```bash
   # 查看服务状态
   pm2 monit

   # 查看系统资源
   htop
   ``` 