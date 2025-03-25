/**
 * 事件总线系统
 * 用于模块间的事件通信
 */

// 事件处理器类型
type EventHandler = (...args: any[]) => void;

// 事件总线类
class EventBus {
  private events: Map<string, Set<EventHandler>> = new Map();

  /**
   * 订阅事件
   * @param eventName 事件名称
   * @param handler 事件处理器
   * @returns 取消订阅的函数
   */
  subscribe(eventName: string, handler: EventHandler): () => void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }

    this.events.get(eventName)!.add(handler);

    // 返回取消订阅的函数
    return () => {
      this.unsubscribe(eventName, handler);
    };
  }

  /**
   * 取消订阅事件
   * @param eventName 事件名称
   * @param handler 事件处理器
   */
  unsubscribe(eventName: string, handler: EventHandler): void {
    if (!this.events.has(eventName)) {
      return;
    }

    this.events.get(eventName)!.delete(handler);
    
    // 如果没有处理器了，清理事件
    if (this.events.get(eventName)!.size === 0) {
      this.events.delete(eventName);
    }
  }

  /**
   * 发布事件
   * @param eventName 事件名称
   * @param args 事件参数
   */
  publish(eventName: string, ...args: any[]): void {
    if (!this.events.has(eventName)) {
      return;
    }

    const handlers = this.events.get(eventName)!;
    handlers.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Error in event handler for "${eventName}":`, error);
      }
    });
  }

  /**
   * 异步发布事件
   * 确保事件处理器在当前执行栈完成后才被调用
   * @param eventName 事件名称
   * @param args 事件参数
   */
  publishAsync(eventName: string, ...args: any[]): Promise<void> {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        this.publish(eventName, ...args);
        resolve();
      }, 0);
    });
  }

  /**
   * 订阅一次性事件
   * 事件触发后自动取消订阅
   * @param eventName 事件名称
   * @param handler 事件处理器
   * @returns 取消订阅的函数
   */
  once(eventName: string, handler: EventHandler): () => void {
    const onceHandler = (...args: any[]) => {
      handler(...args);
      this.unsubscribe(eventName, onceHandler);
    };
    
    return this.subscribe(eventName, onceHandler);
  }

  /**
   * 清空特定事件的所有处理器
   * @param eventName 事件名称
   */
  clear(eventName: string): void {
    this.events.delete(eventName);
  }

  /**
   * 清空所有事件处理器
   */
  clearAll(): void {
    this.events.clear();
  }

  /**
   * 获取已注册的事件名称列表
   * @returns 事件名称数组
   */
  getEventNames(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * 获取特定事件的处理器数量
   * @param eventName 事件名称
   * @returns 处理器数量
   */
  getHandlerCount(eventName: string): number {
    if (!this.events.has(eventName)) {
      return 0;
    }
    return this.events.get(eventName)!.size;
  }
}

// 创建单例实例
export const eventBus = new EventBus();

// 默认导出
export default eventBus; 