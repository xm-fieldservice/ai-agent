from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class SystemMetrics(Base):
    __tablename__ = 'system_metrics'
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    cpu_percent = Column(Float)
    memory_percent = Column(Float)
    disk_percent = Column(Float)
    memory_total = Column(Integer)
    memory_available = Column(Integer)
    disk_total = Column(Integer)
    disk_free = Column(Integer)

class NetworkMetrics(Base):
    __tablename__ = 'network_metrics'
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    protocol = Column(String)
    active_connections = Column(Integer)
    interfaces_count = Column(Integer)
    details = Column(String)  # JSON字符串存储接口详情 