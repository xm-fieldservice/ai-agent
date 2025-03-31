from fastapi import APIRouter, HTTPException
from ..utils.system_monitor import (
    get_system_resources,
    get_system_info,
    check_db_connection,
    get_network_info
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/resources")
async def resources():
    """
    获取系统资源使用情况
    """
    try:
        return await get_system_resources()
    except Exception as e:
        logger.error(f"获取系统资源信息失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取系统资源信息失败")

@router.get("/node-version")
async def node_version():
    """
    获取Node.js版本信息
    """
    try:
        system_info = await get_system_info()
        return {"version": system_info["node_version"]}
    except Exception as e:
        logger.error(f"获取Node.js版本信息失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取Node.js版本信息失败")

@router.get("/package-manager")
async def package_manager():
    """
    获取包管理器信息
    """
    try:
        system_info = await get_system_info()
        return system_info["package_manager"]
    except Exception as e:
        logger.error(f"获取包管理器信息失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取包管理器信息失败")

@router.get("/database")
async def database():
    """
    获取数据库连接状态
    """
    try:
        return await check_db_connection()
    except Exception as e:
        logger.error(f"获取数据库状态失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取数据库状态失败")

@router.get("/network")
async def network():
    """
    获取网络协议信息
    """
    try:
        return await get_network_info()
    except Exception as e:
        logger.error(f"获取网络信息失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取网络信息失败") 