#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import yaml
import requests
import sys

def test_api_key(model_config):
    """测试API密钥是否有效"""
    print(f"正在测试 {model_config['name']} 的API密钥...")
    
    headers = {
        "Authorization": f"Bearer {model_config['api_key']}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": model_config["model_name"],
        "messages": [{"role": "user", "content": "Hello"}],
        "max_tokens": 10
    }
    
    url = f"{model_config['base_url']}/chat/completions"
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        
        if response.status_code == 200:
            print(f"✅ {model_config['name']} API密钥验证成功！")
            return True
        else:
            print(f"❌ {model_config['name']} API密钥验证失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            return False
    except Exception as e:
        print(f"❌ {model_config['name']} API请求出错: {str(e)}")
        return False

def main():
    # 加载配置文件
    config_path = os.path.join("config", "config.yaml")
    
    if not os.path.exists(config_path):
        print(f"错误: 配置文件不存在 {config_path}")
        sys.exit(1)
    
    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    
    if not config or "models" not in config:
        print("错误: 配置文件格式不正确，未找到models部分")
        sys.exit(1)
    
    print("=" * 50)
    print("大模型API密钥测试工具")
    print("=" * 50)
    
    # 检测API密钥是否是默认值
    default_keys = ["your_openai_api_key_here", "your_deepseek_api_key_here", "sk-xxxxxxxxxxxxxxxxxxxxxxxx"]
    success_count = 0
    total_count = 0
    
    for model_id, model_config in config["models"].items():
        total_count += 1
        api_key = model_config.get("api_key", "")
        
        if api_key in default_keys or not api_key:
            print(f"❌ {model_config['name']} API密钥未设置或仍为默认值")
            continue
        
        if test_api_key(model_config):
            success_count += 1
    
    print("\n" + "=" * 50)
    print(f"测试结果: {success_count}/{total_count} 个模型API密钥配置正确")
    
    if success_count == 0:
        print("❌ 没有任何模型配置正确的API密钥，请先设置API密钥后再启动服务")
        sys.exit(1)
    else:
        print("✅ 有可用的API密钥，可以启动服务")

if __name__ == "__main__":
    main() 