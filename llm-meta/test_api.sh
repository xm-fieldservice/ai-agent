#!/bin/bash

echo "正在测试API密钥配置..."

# 检查Python是否已安装
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到Python，请先安装Python 3.8+"
    exit 1
fi

# 安装必要的依赖
echo "正在安装必要的依赖..."
pip3 install pyyaml requests -q

# 运行测试脚本
python3 test_api.py 