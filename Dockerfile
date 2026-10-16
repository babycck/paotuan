FROM python:3.10-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码与静态资源
COPY . .

# 暴露 5432 端口
EXPOSE 5432

# 启动服务
CMD ["python", "server.py"]
