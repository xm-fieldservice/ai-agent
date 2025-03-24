# 企业级大模型公共服务

这是一个企业内部使用的大模型服务平台，支持通过API和Web界面与多种大型语言模型进行交互。

## 功能特性

- API接口：支持简单的文本生成和对话功能
- Web界面：支持PC和移动端的响应式设计
- 模型管理：可配置多个第三方大模型
- 提示词模板：可定制常用提示词模板
- 参数配置：支持温度、最大token等参数配置

## 快速开始

### 前提条件

- Docker 19.03.0+
- Docker Compose 1.27.0+

### 配置API密钥

在使用前需要先配置大模型API密钥。编辑`config/config.yaml`文件，替换示例密钥：

```yaml
models:
  default:
    # ... 其他配置
    api_key: "your_openai_api_key_here"  # 替换为你的OpenAI API密钥
  
  deepseek:
    # ... 其他配置
    api_key: "your_deepseek_api_key_here"  # 替换为你的DeepSeek API密钥
```

### 启动服务

使用Docker Compose启动服务：

```bash
docker-compose up -d
```

服务将在以下地址可用：
- Web界面：http://localhost
- API接口：http://localhost/api
- 健康检查：http://localhost/health

### API使用示例

#### 文本生成

```bash
curl -X POST http://localhost/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "分析2023年中国新能源市场的发展趋势",
    "model_id": "deepseek",
    "parameters": {
      "temperature": 0.3,
      "max_tokens": 500
    }
  }'
```

#### 对话接口

```bash
curl -X POST http://localhost/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "你好，请介绍一下自己"}
    ],
    "model_id": "default"
  }'
```

## 项目结构

```
llm-meta/
├── config/                # 配置文件目录
│   └── config.yaml        # 主配置文件
├── frontend/              # 前端代码
│   ├── index.html         # 前端页面
│   ├── Dockerfile         # 前端Docker构建文件
│   └── nginx.conf         # Nginx配置
├── src/                   # 后端代码
│   └── main.py            # 主应用
├── logs/                  # 日志目录
├── Dockerfile             # 后端Docker构建文件
├── docker-compose.yml     # Docker Compose配置
└── requirements.txt       # Python依赖
```

## 自定义配置

### 添加新模型

编辑`config/config.yaml`文件，添加新的模型配置：

```yaml
models:
  your_model_id:
    name: "您的模型"
    display_name: "模型显示名"
    description: "模型描述"
    provider: "provider_name"
    api_key: "your_api_key"
    base_url: "https://api.example.com/v1"
    model_name: "model_name"
    default_params:
      temperature: 0.5
      max_tokens: 1500
```

### 添加提示词模板

编辑`config/config.yaml`文件，添加新的提示词模板：

```yaml
prompt_templates:
  - id: "your_template_id"
    title: "模板名称"
    content: "模板内容，可以包含{{input}}占位符"
```

## 开发

如果您想在本地开发，可以按照以下步骤设置开发环境：

1. 克隆仓库
2. 安装Python依赖: `pip install -r requirements.txt`
3. 启动后端服务: `python src/main.py`
4. 使用浏览器访问前端页面 