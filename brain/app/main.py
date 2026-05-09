from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.core.config import settings
from app.api.routes import agent, models, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"AgentX Brain 启动 - LOG_LEVEL={settings.LOG_LEVEL}")
    yield
    logger.info("AgentX Brain 关闭")


app = FastAPI(
    title="AgentX Brain",
    description="AgentX 智能体大脑层 - 基于 LangGraph 的推理引擎",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(agent.router)
app.include_router(models.router)
