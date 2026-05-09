#!/bin/bash
set -e

echo "========================================="
echo "  AgentX 智能体系统 - 一键部署脚本"
echo "========================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: 未安装 Docker${NC}"
    echo "请先安装 Docker: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}错误: 未安装 Docker Compose${NC}"
    exit 1
fi

if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}已创建 .env 文件，请编辑配置后重新运行${NC}"
    echo -e "${YELLOW}特别是修改 ENCRYPTION_KEY 为你自己的密钥${NC}"
fi

echo -e "${GREEN}[1/4] 构建沙箱镜像...${NC}"
docker build -t agentx-sandbox -f ../sandbox/Dockerfile.sandbox ../sandbox/

echo -e "${GREEN}[2/4] 构建所有服务...${NC}"
docker compose build --parallel

echo -e "${GREEN}[3/4] 启动服务...${NC}"
docker compose up -d

echo -e "${GREEN}[4/4] 等待服务就绪...${NC}"
sleep 10

echo ""
echo "========================================="
echo "  服务状态"
echo "========================================="
docker compose ps

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  AgentX 部署完成！${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "  前端控制台:  ${GREEN}http://localhost:3000${NC}"
echo -e "  API 服务:    ${GREEN}http://localhost:4000${NC}"
echo -e "  大脑服务:    ${GREEN}http://localhost:8000${NC}"
echo -e "  数据库:      ${GREEN}localhost:5432${NC}"
echo -e "  Redis:       ${GREEN}localhost:6379${NC}"
echo ""
echo -e "  使用 ${YELLOW}docker compose logs -f${NC} 查看日志"
echo -e "  使用 ${YELLOW}docker compose down${NC} 停止服务"
echo ""
