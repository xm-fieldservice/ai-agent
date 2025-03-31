from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from datetime import datetime
import platform
import os
import sys
import psutil
import json
import logging
import time
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Any
from config import init_config, settings
from database import init_db, get_db, cleanup_old_data
from models import SystemMetrics, NetworkMetrics
from sqlalchemy.orm import Session
from cache import redis_cache
from middleware import APIMonitorMiddleware, ServiceHealthMiddleware

# 初始化配置
settings = init_config()

# 配置日志
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format=settings.LOG_FORMAT,
    handlers=[
        logging.FileHandler(settings.LOG_FILE),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG
)

# 初始化数据库
@app.on_event("startup")
async def startup_event():
    init_db()
    logger.info("数据库初始化完成")

# API密钥认证
api_key_header = APIKeyHeader(name="X-API-Key")

async def verify_api_key(api_key: str = Depends(api_key_header)):
    if api_key != settings.API_KEY:
        raise HTTPException(
            status_code=403,
            detail="无效的API密钥"
        )
    return api_key

# 请求限流中间件
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, rate_limit_per_minute: int = settings.RATE_LIMIT):
        super().__init__(app)
        self.rate_limit = rate_limit_per_minute
        self.requests: Dict[str, List[float]] = {}

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        now = time.time()
        
        # 清理旧的请求记录
        if client_ip in self.requests:
            self.requests[client_ip] = [
                timestamp for timestamp in self.requests[client_ip]
                if now - timestamp < 60
            ]
        else:
            self.requests[client_ip] = []

        # 检查请求频率
        if len(self.requests[client_ip]) >= self.rate_limit:
            raise HTTPException(
                status_code=429,
                detail="请求过于频繁，请稍后再试"
            )

        # 记录新的请求
        self.requests[client_ip].append(now)
        
        # 添加安全相关的响应头
        response = await call_next(request)
        if settings.SECURE_HEADERS:
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# 添加请求限流中间件
app.add_middleware(RateLimitMiddleware)

# 添加API监控中间件
app.add_middleware(APIMonitorMiddleware)
app.add_middleware(ServiceHealthMiddleware)

# 配置静态文件
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_root():
    return FileResponse("static/index.html")

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
    """健康检查接口"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/system/resources", dependencies=[Depends(verify_api_key)])
async def get_system_resources(db: Session = Depends(get_db)):
    """获取系统资源使用情况"""
    try:
        # 尝试从缓存获取数据
        cached_data = redis_cache.get_system_metrics()
        if cached_data:
            return cached_data

        # 如果缓存不存在，则获取新数据
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # 创建新的系统指标记录
        metrics = SystemMetrics(
            cpu_percent=cpu_percent,
            memory_percent=memory.percent,
            disk_percent=disk.percent,
            memory_total=memory.total,
            memory_available=memory.available,
            disk_total=disk.total,
            disk_free=disk.free
        )
        
        # 保存到数据库
        db.add(metrics)
        db.commit()
        
        # 准备响应数据
        response_data = {
            "cpu": cpu_percent,
            "memory": memory.percent,
            "disk": disk.percent,
            "details": {
                "memory_total": memory.total,
                "memory_available": memory.available,
                "disk_total": disk.total,
                "disk_free": disk.free,
                "timestamp": datetime.now().isoformat()
            }
        }
        
        # 缓存数据
        redis_cache.set_system_metrics(response_data)
        
        return response_data
    except Exception as e:
        logger.error(f"获取系统资源信息失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取系统资源信息失败")

@app.get("/system/node-version", dependencies=[Depends(verify_api_key)])
async def get_node_version():
    """获取Node.js版本信息"""
    try:
        node_version = os.popen('node --version').read().strip()
        return {"version": node_version}
    except Exception as e:
        logger.error(f"获取Node.js版本信息失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取Node.js版本信息失败")

@app.get("/system/package-manager", dependencies=[Depends(verify_api_key)])
async def get_package_manager():
    """获取包管理器信息"""
    try:
        npm_version = os.popen('npm --version').read().strip()
        return {
            "name": "npm",
            "version": npm_version
        }
    except Exception as e:
        logger.error(f"获取包管理器信息失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取包管理器信息失败")

@app.get("/system/database", dependencies=[Depends(verify_api_key)])
async def get_database_status():
    """获取数据库连接状态"""
    try:
        import sqlite3
        conn = sqlite3.connect('ai_agent.db')
        cursor = conn.cursor()
        cursor.execute('SELECT SQLITE_VERSION()')
        version = cursor.fetchone()[0]
        conn.close()
        
        return {
            "type": "SQLite",
            "connected": True,
            "version": version
        }
    except Exception as e:
        logger.error(f"获取数据库状态失败: {str(e)}")
        return {
            "type": "SQLite",
            "connected": False,
            "version": None,
            "error": str(e)
        }

@app.get("/system/network", dependencies=[Depends(verify_api_key)])
async def get_network_info(db: Session = Depends(get_db)):
    """获取网络协议信息"""
    try:
        # 尝试从缓存获取数据
        cached_data = redis_cache.get_network_info()
        if cached_data:
            return cached_data

        # 如果缓存不存在，则获取新数据
        network_info = psutil.net_if_stats()
        connections = psutil.net_connections()
        
        details = {
            "interfaces": [name for name in network_info.keys()],
            "timestamp": datetime.now().isoformat()
        }
        
        # 创建新的网络指标记录
        metrics = NetworkMetrics(
            protocol="HTTPS" if settings.SSL_CERTFILE else "HTTP",
            active_connections=len(connections),
            interfaces_count=len(network_info),
            details=json.dumps(details)
        )
        
        # 保存到数据库
        db.add(metrics)
        db.commit()
        
        # 准备响应数据
        response_data = {
            "protocol": "HTTPS" if settings.SSL_CERTFILE else "HTTP",
            "interfaces": len(network_info),
            "active_connections": len(connections),
            "details": details
        }
        
        # 缓存数据
        redis_cache.set_network_info(response_data)
        
        return response_data
    except Exception as e:
        logger.error(f"获取网络信息失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取网络信息失败")

@app.get("/metrics/history", dependencies=[Depends(verify_api_key)])
async def get_metrics_history(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """获取历史监控数据"""
    try:
        query = db.query(SystemMetrics)
        if start_time:
            query = query.filter(SystemMetrics.timestamp >= start_time)
        if end_time:
            query = query.filter(SystemMetrics.timestamp <= end_time)
            
        metrics = query.order_by(SystemMetrics.timestamp.desc()).limit(limit).all()
        
        return [{
            "timestamp": m.timestamp.isoformat(),
            "cpu": m.cpu_percent,
            "memory": m.memory_percent,
            "disk": m.disk_percent,
            "details": {
                "memory_total": m.memory_total,
                "memory_available": m.memory_available,
                "disk_total": m.disk_total,
                "disk_free": m.disk_free
            }
        } for m in metrics]
    except Exception as e:
        logger.error(f"获取历史监控数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取历史监控数据失败")

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

@app.get("/monitoring/api-stats", dependencies=[Depends(verify_api_key)])
async def get_api_stats():
    """获取API监控统计数据"""
    try:
        stats = redis_cache.get_data("api_stats")
        if not stats:
            return {
                "message": "暂无统计数据",
                "timestamp": datetime.now().isoformat()
            }
        return stats
    except Exception as e:
        logger.error(f"获取API统计数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取API统计数据失败")

@app.get("/monitoring/service-health", dependencies=[Depends(verify_api_key)])
async def get_service_health():
    """获取服务健康状态"""
    try:
        health_status = redis_cache.get_data("service_health")
        if not health_status:
            # 如果缓存中没有数据，触发一次健康检查
            middleware = next(m for m in app.middleware if isinstance(m, ServiceHealthMiddleware))
            health_status = await middleware.check_service_health()
        return health_status
    except Exception as e:
        logger.error(f"获取服务健康状态失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取服务健康状态失败")

@app.get("/monitoring/performance", dependencies=[Depends(verify_api_key)])
async def get_performance_metrics():
    """获取性能指标"""
    try:
        # 获取进程信息
        process = psutil.Process()
        
        # 收集性能指标
        metrics = {
            "cpu_percent": process.cpu_percent(),
            "memory_info": {
                "rss": process.memory_info().rss,  # 物理内存
                "vms": process.memory_info().vms,  # 虚拟内存
            },
            "threads": process.num_threads(),
            "open_files": len(process.open_files()),
            "connections": len(process.connections()),
            "io_counters": {
                "read_count": process.io_counters().read_count,
                "write_count": process.io_counters().write_count,
                "read_bytes": process.io_counters().read_bytes,
                "write_bytes": process.io_counters().write_bytes,
            },
            "timestamp": datetime.now().isoformat()
        }
        
        # 缓存性能指标
        redis_cache.set_data("performance_metrics", metrics, 60)
        
        return metrics
    except Exception as e:
        logger.error(f"获取性能指标失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取性能指标失败")

if __name__ == "__main__":
    logger.info(f"Starting {settings.PROJECT_NAME} API server...")
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        ssl_keyfile=settings.SSL_KEYFILE,
        ssl_certfile=settings.SSL_CERTFILE,
        log_level=settings.LOG_LEVEL.lower()
    ) 