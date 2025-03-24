@echo off
echo 正在启动企业大模型公共服务...

:: 检查日志目录
if not exist logs (
    echo 创建日志目录...
    mkdir logs
)

:: 检查配置文件
if not exist config\config.yaml (
    echo 错误: 配置文件不存在，请先创建 config\config.yaml 文件
    exit /b 1
)

:: 询问是否测试API密钥
set /p test_api=是否测试API密钥配置? (推荐，y/n): 
if /i "%test_api%"=="y" (
    echo 正在测试API密钥...
    
    :: 检查Python是否已安装
    python --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo 无法测试API密钥: 未找到Python
    ) else (
        :: 安装必要的依赖
        pip install pyyaml requests -q
        
        :: 运行测试脚本
        python test_api.py
        if %errorlevel% neq 0 (
            echo API密钥测试失败，请检查配置后重试
            exit /b 1
        )
    )
) else (
    echo 跳过API密钥测试
    echo 请确保已在 config\config.yaml 中设置了正确的API密钥
)

echo 如需修改配置，请在启动前编辑配置文件

:: 启动服务
echo 正在启动Docker容器...
docker-compose up -d

echo 服务已启动!
echo - API服务地址: http://localhost:8000
echo - Web界面地址: http://localhost:80
echo - 查看日志: docker-compose logs -f

pause 