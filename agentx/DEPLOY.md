# AgentX 智能体系统 - Linux 部署教程

本教程将指导你在 Linux 服务器上通过 Docker Compose 一键部署 AgentX 智能体系统。

---

## 系统要求

| 项目 | 最低配置 | 推荐配置 |
|------|----------|----------|
| 操作系统 | Ubuntu 20.04+ / CentOS 8+ / Debian 11+ | Ubuntu 22.04 LTS |
| CPU | 2 核 | 4 核 |
| 内存 | 4 GB | 8 GB |
| 磁盘 | 20 GB | 50 GB |
| Docker | 20.10+ | 24.0+ |
| Docker Compose | V2 | V2 (最新版) |

---

## 第一步：安装 Docker

### Ubuntu / Debian

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 将当前用户加入 docker 组（免 sudo）
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker compose version
```

### CentOS / RHEL

```bash
# 安装必要依赖
sudo yum install -y yum-utils

# 添加 Docker 官方仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户加入 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker compose version
```

---

## 第二步：克隆项目

```bash
git clone https://github.com/你的用户名/agentx.git
cd agentx
```

---

## 第三步：配置环境变量

```bash
cd deploy
cp .env.example .env
nano .env
```

编辑 `.env` 文件，修改以下关键配置：

```env
# 数据库密码（建议修改为强密码）
POSTGRES_PASSWORD=your-strong-password-here

# 加密密钥（必须修改！用于加密 API Key 等敏感信息）
ENCRYPTION_KEY=your-secret-encryption-key-change-this
```

> **重要提示**：`ENCRYPTION_KEY` 是加密 API Key 等敏感信息的密钥，请务必修改为你自己的随机字符串，且部署后不要随意更改，否则已加密的数据将无法解密。

---

## 第四步：一键部署

```bash
chmod +x deploy.sh
./deploy.sh
```

脚本将自动完成以下操作：

1. 检查 Docker 和 Docker Compose 是否已安装
2. 创建 `.env` 配置文件（如不存在）
3. 构建 AgentX 沙箱镜像
4. 并行构建所有服务镜像
5. 启动所有服务
6. 等待服务就绪并显示状态

---

## 第五步：访问系统

部署完成后，通过浏览器访问：

- **前端控制台**：`http://你的服务器IP:3000`
- **API 服务**：`http://你的服务器IP:4000`

首次使用需要配置 AI 模型 API Key。

---

## 配置 AI 模型

1. 打开前端控制台 `http://你的服务器IP:3000`
2. 进入 **设置** 页面
3. 添加 LLM 配置，填写以下信息：
   - **提供商**：选择 AI 模型提供商
   - **API Key**：填入你的 API Key
   - **模型**：选择要使用的模型

### 支持的提供商和模型

| 提供商 | 支持的模型 |
|--------|-----------|
| OpenAI | GPT-4o, GPT-4o-mini, GPT-4-turbo |
| Anthropic | Claude 3.5 Sonnet, Claude 3 Opus |
| 其他 OpenAI 兼容接口 | 自定义模型名称 |

---

## 常用命令

所有命令在 `deploy/` 目录下执行：

```bash
# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down
# 或使用快捷脚本
./stop.sh

# 查看实时日志
docker compose logs -f
# 或使用快捷脚本（查看最近 100 行）
./logs.sh
# 查看指定服务日志
./logs.sh scheduler

# 重启所有服务
docker compose restart

# 重新构建并启动
docker compose up -d --build

# 查看服务状态
docker compose ps
```

---

## 端口说明

| 端口 | 服务 | 说明 |
|------|------|------|
| 3000 | 前端 | Web 控制台（Next.js） |
| 4000 | 调度层 | API + WebSocket（NestJS） |
| 8000 | 大脑层 | Agent 推理服务（FastAPI） |
| 5432 | 数据库 | PostgreSQL |
| 6379 | 缓存 | Redis |

> 如果端口冲突，可以修改 `docker-compose.yml` 中的端口映射，格式为 `宿主机端口:容器端口`。

---

## 故障排查

### 服务无法启动

```bash
# 查看服务状态
docker compose ps

# 查看具体服务日志
docker compose logs scheduler
docker compose logs brain
docker compose logs frontend

# 检查端口是否被占用
sudo lsof -i :3000
sudo lsof -i :4000
sudo lsof -i :5432
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 是否就绪
docker compose exec postgres pg_isready -U agentx

# 查看 PostgreSQL 日志
docker compose logs postgres

# 手动连接测试
docker compose exec postgres psql -U agentx -d agentx
```

### 沙箱创建失败

```bash
# 检查 Docker Socket 是否正确挂载
ls -la /var/run/docker.sock

# 确认沙箱镜像已构建
docker images | grep agentx-sandbox

# 如果镜像不存在，手动构建
docker build -t agentx-sandbox -f ../sandbox/Dockerfile.sandbox ../sandbox/
```

### AI 模型调用失败

1. 检查 API Key 是否正确配置
2. 检查服务器是否能访问 AI 模型的 API 端点
3. 查看调度层日志：`docker compose logs scheduler`

### Redis 连接失败

```bash
# 检查 Redis 是否就绪
docker compose exec redis redis-cli ping

# 查看 Redis 日志
docker compose logs redis
```

---

## 更新部署

当项目有新版本发布时，按以下步骤更新：

```bash
# 1. 拉取最新代码
cd agentx
git pull origin main

# 2. 重新构建镜像
cd deploy
docker compose build --parallel

# 3. 重启服务（自动替换旧容器）
docker compose up -d --remove-orphans

# 4. 验证服务状态
docker compose ps
```

---

## 数据备份

### 备份数据库

```bash
# 导出数据库
docker compose exec postgres pg_dump -U agentx agentx > backup_$(date +%Y%m%d).sql

# 恢复数据库
cat backup_20240101.sql | docker compose exec -T postgres psql -U agentx agentx
```

### 备份 Redis

```bash
# Redis 开启了 AOF 持久化，数据文件在 volume 中
# 查看数据卷位置
docker volume inspect deploy_redisdata
```

---

## 卸载

```bash
# 停止并删除所有容器、网络
docker compose down

# 同时删除数据卷（会丢失所有数据！）
docker compose down -v

# 删除所有相关镜像
docker rmi $(docker images | grep agentx | awk '{print $3}')
```

---

## 安全建议

1. **修改默认密码**：部署前务必修改 `.env` 中的 `POSTGRES_PASSWORD` 和 `ENCRYPTION_KEY`
2. **防火墙配置**：仅开放必要端口（3000），数据库和 Redis 端口不要对外暴露
3. **HTTPS**：生产环境建议在前面加一层 Nginx 反向代理并配置 SSL 证书
4. **定期备份**：设置定时任务定期备份数据库
5. **更新镜像**：定期更新基础镜像以修复安全漏洞
