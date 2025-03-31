from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path

class Settings(BaseSettings):
    # 基础配置
    PROJECT_NAME: str = "AI-Agent"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # API配置
    API_KEY: str = "your-secure-api-key"  # 请在生产环境中修改
    RATE_LIMIT: int = 60  # 每分钟请求限制
    
    # 服务器配置
    HOST: str = "0.0.0.0"
    PORT: int = 3000
    
    # CORS配置
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://ai-agent.xm-fieldservice.com"
    ]
    
    # 数据库配置
    DB_URL: str = "sqlite:///ai_agent.db"
    
    # Redis配置
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = None
    REDIS_DB: int = 0
    
    # 日志配置
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE: str = "api.log"
    
    # 监控配置
    MONITOR_INTERVAL: int = 60  # 监控数据收集间隔（秒）
    DATA_RETENTION_DAYS: int = 30  # 监控数据保留天数
    
    # 安全配置
    SSL_KEYFILE: str = None
    SSL_CERTFILE: str = None
    SECURE_HEADERS: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# 创建配置实例
settings = Settings()

# 确保必要的目录存在
def ensure_directories():
    """确保必要的目录存在"""
    directories = [
        "logs",
        "data",
        "static",
        "temp"
    ]
    
    base_dir = Path(__file__).parent
    for directory in directories:
        dir_path = base_dir / directory
        dir_path.mkdir(exist_ok=True)

# 验证配置
def validate_settings():
    """验证配置是否合法"""
    assert settings.API_KEY != "your-secure-api-key", "请设置安全的API密钥"
    assert len(settings.API_KEY) >= 32, "API密钥长度应至少为32个字符"
    
    if settings.SECURE_HEADERS:
        assert all(origin.startswith(('http://', 'https://')) for origin in settings.CORS_ORIGINS), \
            "CORS origins 必须以 http:// 或 https:// 开头"
    
    if settings.SSL_CERTFILE or settings.SSL_KEYFILE:
        assert settings.SSL_CERTFILE and settings.SSL_KEYFILE, \
            "SSL证书和密钥必须同时提供"
        assert Path(settings.SSL_CERTFILE).exists(), f"SSL证书文件不存在: {settings.SSL_CERTFILE}"
        assert Path(settings.SSL_KEYFILE).exists(), f"SSL密钥文件不存在: {settings.SSL_KEYFILE}"

# 初始化配置
def init_config():
    """初始化配置"""
    ensure_directories()
    validate_settings()
    return settings 