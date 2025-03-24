from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import yaml
import logging
import requests
import markdown
import json
import os
from datetime import datetime

# 配置日志
os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("logs/llm_api.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="企业大模型公共服务")

# 启用CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境中应该限制来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 加载配置
def get_config():
    if not hasattr(get_config, "config"):
        config_path = os.path.join("config", "config.yaml")
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                get_config.config = yaml.safe_load(f)
                logger.info(f"配置加载成功: {config_path}")
        except Exception as e:
            logger.error(f"配置加载失败: {str(e)}")
            get_config.config = {"models": {}, "prompt_templates": []}
    return get_config.config

# 模型请求
class GenerateRequest(BaseModel):
    prompt: str
    model_id: str = "default"
    parameters: Optional[Dict[str, Any]] = None
    format: str = "markdown"  # 支持markdown和text

# 对话消息
class Message(BaseModel):
    role: str  # user或assistant
    content: str

# 对话历史请求
class ChatRequest(BaseModel):
    messages: List[Message]
    model_id: str = "default"
    parameters: Optional[Dict[str, Any]] = None
    format: str = "markdown"

# 文本生成端点
@app.post("/api/generate")
def generate_text(request: GenerateRequest):
    config = get_config()
    
    # 获取模型配置
    if request.model_id not in config["models"]:
        if "default" not in config["models"]:
            raise HTTPException(400, "模型未找到且无默认模型")
        model_config = config["models"]["default"]
    else:
        model_config = config["models"][request.model_id]
    
    # 合并参数
    params = model_config.get("default_params", {}).copy()
    if request.parameters:
        params.update(request.parameters)
    
    # 调用LLM API
    try:
        response = call_llm_api(request.prompt, model_config, params)
        
        # 返回结果，根据格式要求处理
        text = response.get("text", "")
        if request.format == "markdown":
            # 确保文本是有效的Markdown
            text = text.strip()
        
        # 记录日志
        log_api_call(model_config["name"], request.prompt, text, params)
        
        return {
            "text": text,
            "model": model_config["name"],
            "format": request.format
        }
    except Exception as e:
        logger.error(f"API调用失败: {str(e)}")
        raise HTTPException(500, f"调用模型失败: {str(e)}")

# 对话端点
@app.post("/api/chat")
def chat_completion(request: ChatRequest):
    config = get_config()
    
    # 获取模型配置
    if request.model_id not in config["models"]:
        if "default" not in config["models"]:
            raise HTTPException(400, "模型未找到且无默认模型")
        model_config = config["models"]["default"]
    else:
        model_config = config["models"][request.model_id]
    
    # 合并参数
    params = model_config.get("default_params", {}).copy()
    if request.parameters:
        params.update(request.parameters)
    
    # 格式化聊天历史
    chat_history = format_chat_history(request.messages)
    
    try:
        response = call_chat_api(chat_history, model_config, params)
        
        # 处理响应
        assistant_message = response.get("text", "")
        
        # 记录日志
        prompt = request.messages[-1].content if request.messages else ""
        log_api_call(model_config["name"], prompt, assistant_message, params)
        
        return {
            "message": {
                "role": "assistant",
                "content": assistant_message
            },
            "model": model_config["name"],
            "format": request.format
        }
    except Exception as e:
        logger.error(f"聊天API调用失败: {str(e)}")
        raise HTTPException(500, f"调用聊天失败: {str(e)}")

# 获取所有模型
@app.get("/api/models")
def get_models():
    config = get_config()
    models = []
    for model_id, model_config in config["models"].items():
        models.append({
            "id": model_id,
            "name": model_config.get("display_name", model_id),
            "provider": model_config.get("provider", "unknown"),
            "description": model_config.get("description", "")
        })
    return {"models": models}

# 获取提示词模板
@app.get("/api/prompt-templates")
def get_prompt_templates():
    config = get_config()
    return {"templates": config.get("prompt_templates", [])}

# 调用LLM API
def call_llm_api(prompt, model_config, params):
    """统一的模型调用接口"""
    if model_config["provider"] == "openai":
        return call_openai_api(prompt, model_config, params)
    elif model_config["provider"] == "minimax":
        return call_minimax_api(prompt, model_config, params)
    elif model_config["provider"] == "deepseek":
        return call_deepseek_api(prompt, model_config, params)
    else:
        raise ValueError(f"不支持的提供商: {model_config['provider']}")

def call_openai_api(prompt, model_config, params):
    """调用OpenAI兼容API"""
    headers = {
        "Authorization": f"Bearer {model_config['api_key']}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": model_config["model_name"],
        "messages": [{"role": "user", "content": prompt}],
        "temperature": params.get("temperature", 0.7),
        "max_tokens": params.get("max_tokens", 1000),
        "top_p": params.get("top_p", 1.0),
        "presence_penalty": params.get("presence_penalty", 0),
        "frequency_penalty": params.get("frequency_penalty", 0)
    }
    
    url = f"{model_config['base_url']}/chat/completions"
    
    response = requests.post(url, headers=headers, json=data, timeout=30)
    
    if response.status_code != 200:
        raise Exception(f"OpenAI API调用失败: {response.status_code} {response.text}")
    
    result = response.json()
    
    return {
        "text": result["choices"][0]["message"]["content"],
        "model": model_config["model_name"],
        "request_id": result.get("id", "")
    }

def call_deepseek_api(prompt, model_config, params):
    """调用DeepSeek API"""
    # DeepSeek API格式与OpenAI类似
    return call_openai_api(prompt, model_config, params)

def call_minimax_api(prompt, model_config, params):
    """调用MiniMax API"""
    headers = {
        "Authorization": f"Bearer {model_config['api_key']}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": model_config["model_name"],
        "messages": [{"role": "user", "content": prompt}],
        "temperature": params.get("temperature", 0.7),
        "max_tokens": params.get("max_tokens", 1000),
        "top_p": params.get("top_p", 1.0)
    }
    
    url = f"{model_config['base_url']}/chat/completions"
    
    response = requests.post(url, headers=headers, json=data, timeout=30)
    
    if response.status_code != 200:
        raise Exception(f"MiniMax API调用失败: {response.status_code} {response.text}")
    
    result = response.json()
    
    return {
        "text": result["choices"][0]["message"]["content"],
        "model": model_config["model_name"],
        "request_id": result.get("id", "")
    }

def format_chat_history(messages):
    """将消息历史转换为API需要的格式"""
    formatted_messages = []
    for msg in messages:
        formatted_messages.append({
            "role": msg.role,
            "content": msg.content
        })
    return formatted_messages

def call_chat_api(messages, model_config, params):
    """调用聊天完成API"""
    headers = {
        "Authorization": f"Bearer {model_config['api_key']}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": model_config["model_name"],
        "messages": messages,
        "temperature": params.get("temperature", 0.7),
        "max_tokens": params.get("max_tokens", 1000),
        "top_p": params.get("top_p", 1.0)
    }
    
    url = f"{model_config['base_url']}/chat/completions"
    
    response = requests.post(url, headers=headers, json=data, timeout=30)
    
    if response.status_code != 200:
        raise Exception(f"聊天API调用失败: {response.status_code} {response.text}")
    
    result = response.json()
    
    return {
        "text": result["choices"][0]["message"]["content"],
        "model": model_config["model_name"],
        "request_id": result.get("id", "")
    }

def log_api_call(model_name, prompt, response, params):
    """记录API调用日志"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "model": model_name,
        "prompt": prompt[:100] + "..." if len(prompt) > 100 else prompt,
        "response_length": len(response),
        "parameters": params
    }
    
    logger.info(f"API调用: {json.dumps(log_entry, ensure_ascii=False)}")
    
    # 也可以将日志写入专门的日志文件
    os.makedirs("logs", exist_ok=True)
    with open("logs/api_calls.log", "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")

# 健康检查端点
@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# 主入口
if __name__ == "__main__":
    import uvicorn
    port = get_config().get("settings", {}).get("server", {}).get("port", 8000)
    host = get_config().get("settings", {}).get("server", {}).get("host", "0.0.0.0")
    uvicorn.run(app, host=host, port=port) 