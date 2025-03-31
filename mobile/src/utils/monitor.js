/**
 * 监控工具初始化
 * 整合日志、性能和网络监控
 */
import logger from './logger';
import performanceMonitor from './performance';
import networkMonitor from './network-monitor';
// 环境类型
export var Environment;
(function (Environment) {
    Environment["DEVELOPMENT"] = "development";
    Environment["STAGING"] = "staging";
    Environment["PRODUCTION"] = "production";
})(Environment || (Environment = {}));
// 默认配置
const defaultConfig = {
    environment: process.env.NODE_ENV === 'production'
        ? Environment.PRODUCTION
        : Environment.DEVELOPMENT,
    appVersion: '1.0.0',
    logger: {
        enabled: true,
        remoteLogging: false,
        logLevel: 'info'
    },
    performance: {
        enabled: true,
        remoteReporting: false
    },
    network: {
        enabled: true,
        includeRequestBody: false,
        includeResponseBody: false
    }
};
// 初始化所有监控工具
export function initMonitoring(config = {}) {
    const mergedConfig = mergeConfig(defaultConfig, config);
    // 初始化日志
    logger.init({
        enabled: mergedConfig.logger.enabled,
        remoteLogging: mergedConfig.logger.remoteLogging,
        remoteEndpoint: mergedConfig.remoteEndpoint,
        logLevel: mergedConfig.logger.logLevel
    });
    // 初始化性能监控
    performanceMonitor.init({
        enabled: mergedConfig.performance.enabled,
        remoteReporting: mergedConfig.performance.remoteReporting,
        remoteEndpoint: mergedConfig.remoteEndpoint
    });
    // 初始化网络监控
    networkMonitor.init({
        enabled: mergedConfig.network.enabled,
        includeRequestBody: mergedConfig.network.includeRequestBody,
        includeResponseBody: mergedConfig.network.includeResponseBody
    });
    // 记录初始化信息
    logger.info('监控系统初始化完成', {
        environment: mergedConfig.environment,
        appVersion: mergedConfig.appVersion,
        userAgent: navigator.userAgent
    });
    return {
        logger,
        performanceMonitor,
        networkMonitor,
        config: mergedConfig
    };
}
// 深度合并配置
function mergeConfig(target, source) {
    const output = { ...target };
    if (source && typeof source === 'object') {
        Object.keys(source).forEach(key => {
            if (source[key] instanceof Object && key in target) {
                output[key] = mergeConfig(target[key], source[key]);
            }
            else {
                output[key] = source[key];
            }
        });
    }
    return output;
}
// 获取当前环境
export function getEnvironment() {
    return defaultConfig.environment;
}
// 是否为生产环境
export function isProduction() {
    return defaultConfig.environment === Environment.PRODUCTION;
}
// 是否为开发环境
export function isDevelopment() {
    return defaultConfig.environment === Environment.DEVELOPMENT;
}
// 创建测试数据
export function generateTestData() {
    // 模拟日志
    logger.debug('测试调试日志');
    logger.info('测试信息日志');
    logger.warn('测试警告日志');
    logger.error('测试错误日志', new Error('测试错误'));
    // 模拟性能指标
    performanceMonitor.measure('测试性能指标');
    // 模拟网络请求
    fetch('/api/test')
        .then(() => logger.info('测试网络请求完成'))
        .catch(err => logger.error('测试网络请求失败', err));
}
// 导出单例
export { logger, performanceMonitor, networkMonitor };
