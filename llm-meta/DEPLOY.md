# 企业级大模型公共服务 - 部署指南

本文档提供了在不同环境下部署企业级大模型公共服务的详细步骤。

## 目录

1. [前提条件](#前提条件)
2. [基本部署](#基本部署)
3. [高级配置](#高级配置)
4. [常见问题](#常见问题)

## 前提条件

部署前，请确保系统满足以下要求：

### 软件要求

- Docker 19.03.0+
- Docker Compose 1.27.0+
- 推荐：Python 3.8+ (用于测试API密钥)

### 硬件推荐配置

- CPU: 2核心以上
- 内存: 最少2GB，推荐4GB
- 存储空间: 最少5GB可用空间

### API密钥

需要获取至少一个大模型提供商的API密钥，支持的提供商：
- OpenAI (GPT系列)
- DeepSeek
- MiniMax

## 基本部署

### 1. 获取代码

可以通过以下方式获取代码：

```bash
# 使用Git克隆
git clone https://your-repository-url/llm-meta.git
cd llm-meta

# 或直接下载项目压缩包并解压
```

### 2. 配置API密钥

编辑`config/config.yaml`文件，填入您的API密钥：

```yaml
models:
  default:
    api_key: "sk-your-openai-api-key"
    # ...其他配置保持不变
  
  deepseek:
    api_key: "sk-your-deepseek-api-key"
    # ...其他配置保持不变
```

### 3. 测试API密钥

建议先测试API密钥是否有效：

```bash
# Linux/Mac
./test_api.sh

# Windows
test_api.bat
```

### 4. 启动服务

```bash
# Linux/Mac
./start.sh

# Windows
start.bat
```

服务将在以下地址可用：
- Web界面：http://localhost
- API接口：http://localhost/api
- 健康检查：http://localhost/health

### 5. 停止服务

```bash
# Linux/Mac
./stop.sh

# Windows
stop.bat
```

## 高级配置

### 自定义端口

如果需要更改默认端口，编辑`docker-compose.yml`文件：

```yaml
services:
  # 后端服务
  llm-service:
    ports:
      - "自定义端口:8000"  # 修改为您需要的端口
  
  # 前端服务
  frontend:
    ports:
      - "自定义端口:80"    # 修改为您需要的端口
```

### 配置HTTPS

对于生产环境，建议配置HTTPS。可以通过以下步骤：

1. 获取SSL证书和密钥
2. 修改`frontend/nginx.conf`文件，添加HTTPS配置
3. 更新`docker-compose.yml`中的端口映射

### 添加新模型

如果需要添加新的模型提供商，编辑`config/config.yaml`文件：

```yaml
models:
  new_model:
    name: "新模型名称"
    display_name: "显示名称"
    description: "模型描述"
    provider: "provider_name"  # 支持的提供商: openai, deepseek, minimax
    api_key: "您的API密钥"
    base_url: "API基础URL"
    model_name: "模型名称标识符"
    default_params:
      temperature: 0.7
      max_tokens: 1000
      top_p: 0.9
```

## 常见问题

### 1. 容器无法启动

**症状**: `docker-compose up`命令执行后容器无法正常启动。

**解决方案**:
- 检查Docker服务是否正常运行
- 查看日志: `docker-compose logs`
- 确保端口未被占用: `netstat -an | findstr "80 8000"`(Windows) 或 `netstat -an | grep "80\|8000"`(Linux/Mac)

### 2. API请求失败

**症状**: Web界面无法获取模型列表或发送消息。

**解决方案**:
- 确认API密钥配置正确: 运行测试脚本验证
- 检查网络连接: 确保服务器可以访问模型提供商的API
- 检查日志: `docker-compose logs llm-service`

### 3. 容器内的文件更改不生效

**症状**: 更改配置文件后，容器内服务未应用新配置。

**解决方案**:
- 重启容器: `docker-compose restart`
- 检查卷挂载: 确保`docker-compose.yml`中的卷配置正确

### 4. 前端无法连接到后端

**症状**: Web界面可以打开，但无法获取数据或发送请求。

**解决方案**:
- 检查`nginx.conf`中的代理配置
- 确保后端服务正常运行
- 检查网络连接: `curl http://localhost:8000/health` 