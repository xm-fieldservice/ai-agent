     FROM alpine:3.17
   
   RUN apk add --no-cache python3 py3-pip
   
   WORKDIR /app
   
   # 安装依赖
   COPY requirements.txt .
   RUN pip3 install --no-cache-dir -r requirements.txt
   
   # 复制应用代码
   COPY . .
   
   # 暴露端口
   EXPOSE 8000
   
   # 启动命令
   CMD ["python3", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]