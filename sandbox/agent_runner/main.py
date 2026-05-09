from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from .routes import router, set_browser_executor
from .browser_executor import BrowserExecutor

browser_instance: BrowserExecutor = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global browser_instance
    logger.info("Agent Runner 启动中...")

    browser_instance = BrowserExecutor()
    try:
        await browser_instance.initialize()
        set_browser_executor(browser_instance)
        logger.info("Playwright 浏览器初始化成功")
    except Exception as e:
        logger.error(f"Playwright 浏览器初始化失败: {e}")

    yield

    logger.info("Agent Runner 关闭中...")
    if browser_instance:
        await browser_instance.close()
    logger.info("Agent Runner 已关闭")


app = FastAPI(
    title="AgentX Sandbox Runner",
    description="智能体沙箱执行层 - 提供命令执行、文件操作、浏览器自动化和搜索能力",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
async def health_check():
    browser_ready = browser_instance is not None and browser_instance.page is not None
    return {
        "status": "healthy" if browser_ready else "degraded",
        "browser_ready": browser_ready,
        "service": "agent-runner",
    }
