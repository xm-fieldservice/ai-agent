import redis
import json
import logging
from typing import Optional, Any, Dict
from datetime import datetime, timedelta
from config import settings

logger = logging.getLogger(__name__)

class RedisCache:
    def __init__(self):
        try:
            self.redis = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD,
                decode_responses=True
            )
            logger.info("Redis连接成功")
        except Exception as e:
            logger.error(f"Redis连接失败: {str(e)}")
            raise

    def set_data(self, key: str, data: Any, expire_seconds: int = 300) -> bool:
        """
        设置缓存数据
        :param key: 缓存键
        :param data: 要缓存的数据
        :param expire_seconds: 过期时间（秒），默认5分钟
        :return: 是否成功
        """
        try:
            serialized_data = json.dumps(data)
            return self.redis.setex(key, expire_seconds, serialized_data)
        except Exception as e:
            logger.error(f"设置缓存失败 - key: {key}, error: {str(e)}")
            return False

    def get_data(self, key: str) -> Optional[Any]:
        """
        获取缓存数据
        :param key: 缓存键
        :return: 缓存的数据，如果不存在则返回None
        """
        try:
            data = self.redis.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"获取缓存失败 - key: {key}, error: {str(e)}")
            return None

    def delete_data(self, key: str) -> bool:
        """
        删除缓存数据
        :param key: 缓存键
        :return: 是否成功
        """
        try:
            return bool(self.redis.delete(key))
        except Exception as e:
            logger.error(f"删除缓存失败 - key: {key}, error: {str(e)}")
            return False

    def set_system_metrics(self, metrics: Dict[str, Any]) -> bool:
        """
        缓存系统指标数据
        :param metrics: 系统指标数据
        :return: 是否成功
        """
        return self.set_data("system_metrics", metrics, 60)  # 1分钟过期

    def get_system_metrics(self) -> Optional[Dict[str, Any]]:
        """
        获取缓存的系统指标数据
        :return: 系统指标数据
        """
        return self.get_data("system_metrics")

    def set_network_info(self, network_info: Dict[str, Any]) -> bool:
        """
        缓存网络信息数据
        :param network_info: 网络信息数据
        :return: 是否成功
        """
        return self.set_data("network_info", network_info, 300)  # 5分钟过期

    def get_network_info(self) -> Optional[Dict[str, Any]]:
        """
        获取缓存的网络信息数据
        :return: 网络信息数据
        """
        return self.get_data("network_info")

    def clear_expired_cache(self) -> None:
        """
        清理过期的缓存数据
        """
        try:
            # Redis会自动清理过期的键，这里可以添加自定义的清理逻辑
            pass
        except Exception as e:
            logger.error(f"清理过期缓存失败: {str(e)}")

# 创建全局Redis缓存实例
redis_cache = RedisCache() 