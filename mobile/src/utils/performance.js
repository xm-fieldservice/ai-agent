/**
 * 性能监控工具
 * 用于收集Web Vitals等性能指标
 */
import logger, { LogType } from './logger';
// 性能指标类型
export var MetricType;
(function (MetricType) {
    // 核心Web Vitals
    MetricType["LCP"] = "LCP";
    MetricType["FID"] = "FID";
    MetricType["CLS"] = "CLS";
    // 其他性能指标
    MetricType["TTFB"] = "TTFB";
    MetricType["FCP"] = "FCP";
    MetricType["TTI"] = "TTI";
    // 自定义指标
    MetricType["CUSTOM"] = "CUSTOM";
})(MetricType || (MetricType = {}));
// 默认配置
const defaultConfig = {
    maxMeasures: 50,
    enabled: true,
    remoteReporting: false
};
class PerformanceMonitor {
    config;
    metrics = [];
    firstInputHandled = false;
    layoutShiftScore = 0;
    largestContentfulPaint = 0;
    firstContentfulPaint = 0;
    constructor(config = {}) {
        this.config = { ...defaultConfig, ...config };
    }
    // 初始化性能监控
    init() {
        if (!this.config.enabled)
            return;
        // 确保PerformanceObserver API可用
        if (!('PerformanceObserver' in window)) {
            logger.warn('PerformanceObserver API不可用，性能监控将不会工作', null, LogType.PERFORMANCE);
            return;
        }
        this.observeLCP();
        this.observeFID();
        this.observeCLS();
        this.observeFCP();
        this.observeTTFB();
        this.observeLongTasks();
        logger.info('性能监控初始化完成', this.config, LogType.PERFORMANCE);
    }
    // 记录自定义性能指标
    measure(name, startMark, endMark) {
        if (!this.config.enabled)
            return;
        try {
            // 使用Performance API测量
            const measure = performance.measure(name, startMark, endMark);
            const value = measure.duration;
            this.addMetric({
                name,
                value,
                type: MetricType.CUSTOM,
                timestamp: Date.now()
            });
            return value;
        }
        catch (error) {
            logger.error(`性能测量失败: ${name}`, error, LogType.PERFORMANCE);
            return 0;
        }
    }
    // 添加性能指标
    addMetric(metric) {
        this.metrics.push(metric);
        // 限制指标数量
        if (this.metrics.length > this.config.maxMeasures) {
            this.metrics.shift();
        }
        // 记录到日志
        logger.logPerformance(metric.name, metric.value);
        // 远程上报
        if (this.config.remoteReporting && this.config.remoteEndpoint) {
            this.reportToRemote(metric);
        }
    }
    // 上报到远程服务器
    async reportToRemote(metric) {
        if (!this.config.remoteEndpoint)
            return;
        try {
            await fetch(this.config.remoteEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metric),
                keepalive: true
            });
        }
        catch (error) {
            logger.error('性能指标上报失败', error, LogType.PERFORMANCE);
        }
    }
    // 获取指标
    getMetrics(type) {
        if (type) {
            return this.metrics.filter(metric => metric.type === type);
        }
        return [...this.metrics];
    }
    // 清除指标
    clearMetrics() {
        this.metrics = [];
        logger.info('性能指标已清除', null, LogType.PERFORMANCE);
    }
    // 观察最大内容绘制 (LCP)
    observeLCP() {
        try {
            const lcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.largestContentfulPaint = lastEntry.startTime;
                this.addMetric({
                    name: 'Largest Contentful Paint',
                    value: this.largestContentfulPaint,
                    type: MetricType.LCP,
                    timestamp: Date.now()
                });
            });
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        }
        catch (error) {
            logger.error('LCP观察失败', error, LogType.PERFORMANCE);
        }
    }
    // 观察首次输入延迟 (FID)
    observeFID() {
        try {
            const fidObserver = new PerformanceObserver((entryList) => {
                if (this.firstInputHandled)
                    return;
                const entries = entryList.getEntries();
                if (entries.length === 0)
                    return;
                this.firstInputHandled = true;
                const firstInput = entries[0];
                const inputDelay = firstInput.processingStart - firstInput.startTime;
                this.addMetric({
                    name: 'First Input Delay',
                    value: inputDelay,
                    type: MetricType.FID,
                    timestamp: Date.now()
                });
            });
            fidObserver.observe({ type: 'first-input', buffered: true });
        }
        catch (error) {
            logger.error('FID观察失败', error, LogType.PERFORMANCE);
        }
    }
    // 观察累积布局偏移 (CLS)
    observeCLS() {
        try {
            const clsObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                for (const entry of entries) {
                    // Entry必须是有效的
                    if (!entry.hadRecentInput) {
                        this.layoutShiftScore += entry.value;
                    }
                }
                this.addMetric({
                    name: 'Cumulative Layout Shift',
                    value: this.layoutShiftScore,
                    type: MetricType.CLS,
                    timestamp: Date.now()
                });
            });
            clsObserver.observe({ type: 'layout-shift', buffered: true });
        }
        catch (error) {
            logger.error('CLS观察失败', error, LogType.PERFORMANCE);
        }
    }
    // 观察首次内容绘制 (FCP)
    observeFCP() {
        try {
            const fcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                if (entries.length === 0)
                    return;
                const fcp = entries[0].startTime;
                this.firstContentfulPaint = fcp;
                this.addMetric({
                    name: 'First Contentful Paint',
                    value: fcp,
                    type: MetricType.FCP,
                    timestamp: Date.now()
                });
            });
            fcpObserver.observe({ type: 'paint', buffered: true });
        }
        catch (error) {
            logger.error('FCP观察失败', error, LogType.PERFORMANCE);
        }
    }
    // 观察首字节时间 (TTFB)
    observeTTFB() {
        try {
            // 获取导航计时信息
            const navigationEntry = performance.getEntriesByType('navigation')[0];
            if (navigationEntry) {
                const ttfb = navigationEntry.responseStart;
                this.addMetric({
                    name: 'Time To First Byte',
                    value: ttfb,
                    type: MetricType.TTFB,
                    timestamp: Date.now()
                });
            }
        }
        catch (error) {
            logger.error('TTFB观察失败', error, LogType.PERFORMANCE);
        }
    }
    // 观察长任务
    observeLongTasks() {
        try {
            const longTaskObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                for (const entry of entries) {
                    this.addMetric({
                        name: 'Long Task',
                        value: entry.duration,
                        type: MetricType.CUSTOM,
                        timestamp: Date.now()
                    });
                }
            });
            longTaskObserver.observe({ type: 'longtask', buffered: true });
        }
        catch (error) {
            logger.error('长任务观察失败', error, LogType.PERFORMANCE);
        }
    }
    // 获取性能报告
    getPerformanceReport() {
        return {
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            metrics: this.metrics,
            vitals: {
                lcp: this.largestContentfulPaint,
                fid: this.getMetrics(MetricType.FID)[0]?.value || 0,
                cls: this.layoutShiftScore,
                fcp: this.firstContentfulPaint,
                ttfb: this.getMetrics(MetricType.TTFB)[0]?.value || 0
            }
        };
    }
}
// 创建单例
export const performanceMonitor = new PerformanceMonitor();
// 默认导出
export default performanceMonitor;
