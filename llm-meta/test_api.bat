@echo off
echo 正在测试API密钥配置...

:: 检查Python是否已安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Python，请先安装Python 3.8+
    exit /b 1
)

:: 安装必要的依赖
echo 正在安装必要的依赖...
pip install pyyaml requests -q

:: 运行测试脚本
python test_api.py

pause 