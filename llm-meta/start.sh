#!/bin/bash

echo "正在启动企业大模型公共服务..."

# 检查日志目录
if [ ! -d "logs" ]; then
    echo "创建日志目录..."
    mkdir -p logs
fi

# 检查配置文件
if [ ! -f "config/config.yaml" ]; then
    echo "错误: 配置文件不存在，请先创建 config/config.yaml 文件"
    exit 1
fi

# 询问是否测试API密钥
read -p "是否测试API密钥配置? (推荐，y/n): " test_api
if [ "$test_api" = "y" ] || [ "$test_api" = "Y" ]; then
    echo "正在测试API密钥..."
    
    # 检查Python是否已安装
    if ! command -v python3 &> /dev/null; then
        echo "无法测试API密钥: 未找到Python"
    else
        # 安装必要的依赖
        pip3 install pyyaml requests -q
        
        # 运行测试脚本
        python3 test_api.py
        if [ $? -ne 0 ]; then
            echo "API密钥测试失败，请检查配置后重试"
            exit 1
        fi
    fi
else
    echo "跳过API密钥测试"
    echo "请确保已在 config/config.yaml 中设置了正确的API密钥"
fi

echo "如需修改配置，请在启动前编辑配置文件"

# 启动服务
echo "正在启动Docker容器..."
docker-compose up -d

echo "服务已启动!"
echo "- API服务地址: http://localhost:8000"
echo "- Web界面地址: http://localhost:80"
echo "- 查看日志: docker-compose logs -f" 