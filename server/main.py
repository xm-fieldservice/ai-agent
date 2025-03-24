from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from datetime import datetime

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
    uvicorn.run(app, host="0.0.0.0", port=8000) 