import logger, { LogLevel, LogType } from '../logger';

describe('Logger', () => {
  beforeEach(() => {
    // 重置日志
    logger.clearLogs();
    
    // 初始化日志系统
    logger.init({
      enabled: true,
      maxLogItems: 5,
      logLevel: LogLevel.DEBUG,
      includeDeviceInfo: false
    });
    
    // 模拟控制台方法
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('应该记录不同级别的日志', () => {
    // 创建测试日志
    logger.debug('测试调试日志');
    logger.info('测试信息日志');
    logger.warn('测试警告日志');
    logger.error('测试错误日志');
    
    // 验证日志记录
    const logs = logger.getLogs();
    expect(logs.length).toBe(4);
    
    // 验证日志级别
    expect(logs[0].level).toBe(LogLevel.DEBUG);
    expect(logs[1].level).toBe(LogLevel.INFO);
    expect(logs[2].level).toBe(LogLevel.WARN);
    expect(logs[3].level).toBe(LogLevel.ERROR);
    
    // 验证日志消息
    expect(logs[0].message).toBe('测试调试日志');
    expect(logs[1].message).toBe('测试信息日志');
    expect(logs[2].message).toBe('测试警告日志');
    expect(logs[3].message).toBe('测试错误日志');
  });
  
  it('应该限制日志数量', () => {
    for (let i = 0; i < 10; i++) {
      logger.info(`日志 ${i}`);
    }
    
    const logs = logger.getLogs();
    expect(logs.length).toBe(5);
    expect(logs[0].message).toBe('日志 5');
    expect(logs[4].message).toBe('日志 9');
  });
  
  it('应该按级别筛选日志', () => {
    // 创建测试日志
    logger.debug('调试');
    logger.info('信息');
    logger.warn('警告');
    logger.error('错误');
    
    // 按级别筛选
    const debugLogs = logger.getLogs(LogLevel.DEBUG);
    const infoLogs = logger.getLogs(LogLevel.INFO);
    const warnLogs = logger.getLogs(LogLevel.WARN);
    const errorLogs = logger.getLogs(LogLevel.ERROR);
    
    expect(debugLogs.length).toBe(1);
    expect(infoLogs.length).toBe(1);
    expect(warnLogs.length).toBe(1);
    expect(errorLogs.length).toBe(1);
  });
  
  it('应该按类型筛选日志', () => {
    // 创建不同类型的日志
    logger.info('操作日志', null, LogType.OPERATION);
    logger.info('性能日志', null, LogType.PERFORMANCE);
    logger.error('错误日志', null, LogType.ERROR);
    logger.info('网络日志', null, LogType.NETWORK);
    
    // 按类型筛选
    const operationLogs = logger.getLogs(undefined, LogType.OPERATION);
    const performanceLogs = logger.getLogs(undefined, LogType.PERFORMANCE);
    const errorLogs = logger.getLogs(undefined, LogType.ERROR);
    const networkLogs = logger.getLogs(undefined, LogType.NETWORK);
    
    expect(operationLogs.length).toBe(1);
    expect(performanceLogs.length).toBe(1);
    expect(errorLogs.length).toBe(1);
    expect(networkLogs.length).toBe(1);
  });
  
  it('应该调用相应的控制台方法', () => {
    // 记录日志
    logger.debug('调试');
    logger.info('信息');
    logger.warn('警告');
    logger.error('错误');
    
    // 验证控制台方法调用
    expect(console.debug).toHaveBeenCalled();
    expect(console.info).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
  
  it('应该导出日志为JSON字符串', () => {
    logger.info('测试导出');
    
    const exported = logger.exportLogs();
    expect(typeof exported).toBe('string');
    
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(1);
    expect(parsed[0].message).toBe('测试导出');
  });
}); 