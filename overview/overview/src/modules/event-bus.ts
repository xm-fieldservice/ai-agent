/**
 * 事件总线 - 系统内部通信机制
 * 提供组件间的事件发布与订阅功能
 */

// 事件处理器类型
export type EventHandler = (...args: any[]) => void;

/**
 * 事件总线类
 * 实现发布-订阅模式，用于系统各模块间的松耦合通信
 */
export class EventEmitter {
  private events: Map<string, EventHandler[]> = new Map();
  private maxListeners: number = 10;

  /**
   * 设置每个事件的最大监听器数量
   * @param n 最大监听器数量
   * @returns 事件总线实例
   */
  setMaxListeners(n: number): this {
    this.maxListeners = n;
    return this;
  }

  /**
   * 获取每个事件的最大监听器数量
   * @returns 最大监听器数量
   */
  getMaxListeners(): number {
    return this.maxListeners;
  }

  /**
   * 添加事件监听器
   * @param event 事件名称
   * @param handler 事件处理函数
   * @returns 事件总线实例
   */
  on(event: string, handler: EventHandler): this {
    return this.addListener(event, handler);
  }

  /**
   * 添加事件监听器
   * @param event 事件名称
   * @param handler 事件处理函数
   * @returns 事件总线实例
   */
  addListener(event: string, handler: EventHandler): this {
    const handlers = this.events.get(event) || [];
    
    if (handlers.length >= this.maxListeners) {
      console.warn(`事件 "${event}" 的监听器数量已达到最大值 ${this.maxListeners}`);
    }
    
    handlers.push(handler);
    this.events.set(event, handlers);
    
    return this;
  }

  /**
   * 添加一次性事件监听器
   * @param event 事件名称
   * @param handler 事件处理函数
   * @returns 事件总线实例
   */
  once(event: string, handler: EventHandler): this {
    const onceHandler: EventHandler = (...args: any[]) => {
      this.removeListener(event, onceHandler);
      handler.apply(this, args);
    };
    
    return this.addListener(event, onceHandler);
  }

  /**
   * 移除事件监听器
   * @param event 事件名称
   * @param handler 事件处理函数
   * @returns 事件总线实例
   */
  removeListener(event: string, handler: EventHandler): this {
    const handlers = this.events.get(event);
    
    if (!handlers) {
      return this;
    }
    
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
      
      if (handlers.length === 0) {
        this.events.delete(event);
      } else {
        this.events.set(event, handlers);
      }
    }
    
    return this;
  }

  /**
   * 移除指定事件的所有监听器
   * @param event 事件名称
   * @returns 事件总线实例
   */
  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    
    return this;
  }

  /**
   * 获取事件的所有监听器
   * @param event 事件名称
   * @returns 监听器数组
   */
  listeners(event: string): EventHandler[] {
    return this.events.get(event) || [];
  }

  /**
   * 获取事件的监听器数量
   * @param event 事件名称
   * @returns 监听器数量
   */
  listenerCount(event: string): number {
    return this.listeners(event).length;
  }

  /**
   * 获取所有已注册的事件名称
   * @returns 事件名称数组
   */
  eventNames(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * 触发事件
   * @param event 事件名称
   * @param args 传递给监听器的参数
   * @returns 是否有监听器处理了事件
   */
  emit(event: string, ...args: any[]): boolean {
    const handlers = this.events.get(event);
    
    if (!handlers || handlers.length === 0) {
      return false;
    }
    
    // 创建副本避免处理过程中的修改影响迭代
    [...handlers].forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`事件 "${event}" 处理器执行出错:`, error);
      }
    });
    
    return true;
  }

  /**
   * 触发事件（别名 - 更符合发布订阅语义）
   * @param event 事件名称
   * @param args 传递给监听器的参数
   * @returns 是否有监听器处理了事件
   */
  publish(event: string, ...args: any[]): boolean {
    return this.emit(event, ...args);
  }

  /**
   * 添加事件监听器（别名 - 更符合发布订阅语义）
   * @param event 事件名称
   * @param handler 事件处理函数
   * @returns 事件总线实例
   */
  subscribe(event: string, handler: EventHandler): this {
    return this.on(event, handler);
  }

  /**
   * 移除事件监听器（别名 - 更符合发布订阅语义）
   * @param event 事件名称
   * @param handler 事件处理函数
   * @returns 事件总线实例
   */
  unsubscribe(event: string, handler: EventHandler): this {
    return this.removeListener(event, handler);
  }
}

// 导出默认事件总线实例
export const eventBus = new EventEmitter(); 