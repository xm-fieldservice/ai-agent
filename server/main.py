from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from datetime import datetime
import platform
import os
import sys
import psutil
import json

app = FastAPI()

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 消息模型
class Message(BaseModel):
    type: str
    content: str
    timestamp: Optional[int] = None
    id: Optional[str] = None

# 存储消息
messages = []

# 系统环境检测路由
@app.get("/system/node-version")
async def get_node_version():
    try:
        node_version = os.popen("node -v").read().strip()
        return {
            "version": node_version,
            "compatible": node_version.startswith("v16") or node_version.startswith("v18")
        }
    except:
        return {
            "version": "unknown",
            "compatible": False
        }

@app.get("/system/package-manager")
async def get_package_manager():
    managers = ["npm", "yarn", "pnpm"]
    for manager in managers:
        try:
            version = os.popen(f"{manager} -v").read().strip()
            if version:
                return {"name": manager, "version": version}
        except:
            continue
    return {"name": "unknown", "version": "0.0.0"}

@app.get("/system/network")
async def get_network_info():
    return {
        "protocol": "https" if os.environ.get("HTTPS") else "http",
        "cors": True,
        "secure": os.environ.get("HTTPS", False)
    }

@app.get("/system/database")
async def get_database_status():
    # 这里需要根据实际使用的数据库修改
    try:
        # 模拟数据库连接检查
        return {
            "type": "SQLite",
            "version": "3.0",
            "connected": True
        }
    except:
        return {
            "type": "unknown",
            "version": "0.0",
            "connected": False
        }

# 系统资源监控
@app.get("/system/resources")
async def get_system_resources():
    return {
        "cpu": psutil.cpu_percent(),
        "memory": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage('/').percent
    }

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.post("/messages")
async def create_message(message: Message):
    message.timestamp = int(datetime.now().timestamp() * 1000)
    message.id = str(len(messages) + 1)
    messages.append(message)
    return message

@app.get("/messages")
async def get_messages(before: Optional[str] = None, limit: int = 20):
    if before:
        start_idx = next((i for i, m in enumerate(messages) if m.id == before), len(messages))
        return messages[max(0, start_idx - limit):start_idx]
    return messages[-limit:]

if __name__ == "__main__":
    print("Starting server on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info") 