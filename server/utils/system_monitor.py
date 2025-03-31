import psutil
import os
import sqlite3
from typing import Dict, Any
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

async def get_system_resources() -> Dict[str, Any]:
    """
    获取系统资源使用情况
    返回CPU、内存和磁盘使用率
    """
    try:
        # CPU使用率
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # 内存信息
        memory = psutil.virtual_memory()
        
        # 磁盘信息
        disk = psutil.disk_usage('/')
        
        return {
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
    except Exception as e:
        logger.error(f"获取系统资源信息失败: {str(e)}")
        raise Exception("获取系统资源信息失败")

async def get_system_info() -> Dict[str, Any]:
    """
    获取系统基本信息
    返回Node版本、包管理器信息等
    """
    try:
        # 获取Node.js版本
        node_version = os.popen('node --version').read().strip()
        # 获取npm版本
        npm_version = os.popen('npm --version').read().strip()
        
        return {
            "node_version": node_version,
            "package_manager": {
                "name": "npm",
                "version": npm_version
            }
        }
    except Exception as e:
        logger.error(f"获取系统信息失败: {str(e)}")
        raise Exception("获取系统信息失败")

async def check_db_connection() -> Dict[str, Any]:
    """
    检查数据库连接状态
    """
    try:
        # 这里使用SQLite作为示例
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
        logger.error(f"数据库连接检查失败: {str(e)}")
        return {
            "type": "SQLite",
            "connected": False,
            "version": None,
            "error": str(e)
        }

async def get_network_info() -> Dict[str, Any]:
    """
    获取网络协议信息
    """
    try:
        # 获取网络接口信息
        network_info = psutil.net_if_stats()
        # 获取网络连接信息
        connections = psutil.net_connections()
        
        return {
            "protocol": "HTTP",  # 默认为HTTP，如果配置了SSL则为HTTPS
            "interfaces": len(network_info),
            "active_connections": len(connections),
            "details": {
                "interfaces": [name for name in network_info.keys()],
                "timestamp": datetime.now().isoformat()
            }
        }
    except Exception as e:
        logger.error(f"获取网络信息失败: {str(e)}")
        raise Exception("获取网络信息失败") 