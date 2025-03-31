from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import Session
from contextlib import contextmanager
from typing import Generator
import logging
from config import settings
from models import Base

logger = logging.getLogger(__name__)

# 创建数据库引擎
engine = create_engine(settings.DB_URL)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db() -> None:
    """初始化数据库"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("数据库表创建成功")
    except Exception as e:
        logger.error(f"数据库初始化失败: {str(e)}")
        raise

@contextmanager
def get_db() -> Generator[Session, None, None]:
    """获取数据库会话的上下文管理器"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"数据库操作失败: {str(e)}")
        raise
    finally:
        db.close()

def cleanup_old_data(days: int = settings.DATA_RETENTION_DAYS) -> None:
    """清理旧数据"""
    from datetime import datetime, timedelta
    from models import SystemMetrics, NetworkMetrics
    
    cleanup_date = datetime.utcnow() - timedelta(days=days)
    try:
        with get_db() as db:
            # 删除旧的系统指标数据
            db.query(SystemMetrics).filter(
                SystemMetrics.timestamp < cleanup_date
            ).delete()
            
            # 删除旧的网络指标数据
            db.query(NetworkMetrics).filter(
                NetworkMetrics.timestamp < cleanup_date
            ).delete()
            
            logger.info(f"已清理{days}天前的数据")
    except Exception as e:
        logger.error(f"数据清理失败: {str(e)}")
        raise 