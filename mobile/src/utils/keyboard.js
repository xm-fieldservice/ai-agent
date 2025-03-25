// 键盘管理器
class KeyboardManager {
  constructor() {
    this.keyboardHeight = 0;
    this.isKeyboardVisible = false;
    this.listeners = new Set();
    
    // 初始化事件监听
    this.init();
  }
  
  init() {
    // 监听键盘事件
    window.addEventListener('resize', () => {
      const isKeyboardVisible = window.innerHeight < window.outerHeight;
      if (isKeyboardVisible !== this.isKeyboardVisible) {
        this.isKeyboardVisible = isKeyboardVisible;
        this.keyboardHeight = isKeyboardVisible ? window.outerHeight - window.innerHeight : 0;
        
        // 更新CSS变量
        document.documentElement.style.setProperty('--keyboard-height', `${this.keyboardHeight}px`);
        
        // 通知监听器
        this.notifyListeners({
          isVisible: this.isKeyboardVisible,
          height: this.keyboardHeight
        });
      }
    });
    
    // 监听输入框焦点
    document.addEventListener('focusin', (e) => {
      if (this.isInputElement(e.target)) {
        this.preventBounce(true);
      }
    });
    
    document.addEventListener('focusout', (e) => {
      if (this.isInputElement(e.target)) {
        this.preventBounce(false);
      }
    });
  }
  
  // 判断是否是输入元素
  isInputElement(element) {
    const tagName = element.tagName.toLowerCase();
    return tagName === 'input' || tagName === 'textarea' || element.contentEditable === 'true';
  }
  
  // 防止键盘弹出时页面抖动
  preventBounce(prevent) {
    document.body.classList.toggle('prevent-bounce', prevent);
  }
  
  // 添加监听器
  addListener(callback) {
    this.listeners.add(callback);
    
    // 立即通知当前状态
    callback({
      isVisible: this.isKeyboardVisible,
      height: this.keyboardHeight
    });
    
    // 返回移除监听器的函数
    return () => this.removeListener(callback);
  }
  
  // 移除监听器
  removeListener(callback) {
    this.listeners.delete(callback);
  }
  
  // 通知所有监听器
  notifyListeners(data) {
    this.listeners.forEach(callback => callback(data));
  }
  
  // 获取当前键盘状态
  getState() {
    return {
      isVisible: this.isKeyboardVisible,
      height: this.keyboardHeight
    };
  }
}

// 创建单例实例
const keyboardManager = new KeyboardManager();

export default keyboardManager; 