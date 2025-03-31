from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import time
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import logging
from cache import redis_cache

logger = logging.getLogger(__name__)

class APIMonitorMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.total_requests = 0
        self.error_count = 0
        self.endpoint_stats: Dict[str, Dict] = {}

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        self.total_requests += 1
        endpoint = f"{request.method} {request.url.path}"
        
        # 初始化端点统计
        if endpoint not in self.endpoint_stats:
            self.endpoint_stats[endpoint] = {
                "total_calls": 0,
                "error_count": 0,
                "total_time": 0,
                "avg_time": 0
            }
        
        try:
            response = await call_next(request)
            
            # 计算响应时间
            process_time = time.time() - start_time
            
            # 更新统计信息
            self.endpoint_stats[endpoint]["total_calls"] += 1
            self.endpoint_stats[endpoint]["total_time"] += process_time
            self.endpoint_stats[endpoint]["avg_time"] = (
                self.endpoint_stats[endpoint]["total_time"] / 
                self.endpoint_stats[endpoint]["total_calls"]
            )
            
            # 缓存API统计数据
            stats = {
                "total_requests": self.total_requests,
                "error_count": self.error_count,
                "error_rate": (self.error_count / self.total_requests) * 100,
                "endpoints": self.endpoint_stats,
                "timestamp": datetime.now().isoformat()
            }
            redis_cache.set_data("api_stats", stats, 300)  # 5分钟过期
            
            # 添加处理时间到响应头
            response.headers["X-Process-Time"] = str(process_time)
            return response
            
        except Exception as e:
            self.error_count += 1
            self.endpoint_stats[endpoint]["error_count"] += 1
            logger.error(f"请求处理失败 - {endpoint}: {str(e)}")
            raise

class ServiceHealthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.last_check = datetime.now()
        self.check_interval = timedelta(minutes=5)

    async def check_service_health(self):
        """检查服务健康状态"""
        try:
            # 检查Redis连接
            redis_status = redis_cache.redis.ping()
            
            # 检查数据库连接
            from database import get_db
            db = next(get_db())
            db_status = True
            db.close()
            
            health_status = {
                "redis": {
                    "status": "healthy" if redis_status else "unhealthy",
                    "latency": time.time() - start_time
                },
                "database": {
                    "status": "healthy" if db_status else "unhealthy"
                },
                "timestamp": datetime.now().isoformat()
            }
            
            # 缓存健康状态
            redis_cache.set_data("service_health", health_status, 300)
            
            return health_status
            
        except Exception as e:
            logger.error(f"服务健康检查失败: {str(e)}")
            return {
                "status": "error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def dispatch(self, request: Request, call_next):
        # 定期检查服务健康状态
        if datetime.now() - self.last_check > self.check_interval:
            await self.check_service_health()
            self.last_check = datetime.now()
        
        return await call_next(request) 