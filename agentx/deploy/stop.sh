#!/bin/bash
echo "停止 AgentX 服务..."
cd "$(dirname "$0")"
docker compose down
echo "服务已停止"
