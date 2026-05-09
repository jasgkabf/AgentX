from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from loguru import logger

from app.core.llm import chat

router = APIRouter(prefix="/api/models", tags=["models"])

SUPPORTED_PROVIDERS = [
    {
        "id": "openai",
        "name": "OpenAI",
        "models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
        "default_base_url": "https://api.openai.com/v1",
    },
    {
        "id": "anthropic",
        "name": "Anthropic",
        "models": ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
        "default_base_url": "https://api.anthropic.com",
    },
    {
        "id": "azure",
        "name": "Azure OpenAI",
        "models": ["gpt-4o", "gpt-4", "gpt-35-turbo"],
        "default_base_url": "",
    },
    {
        "id": "openrouter",
        "name": "OpenRouter",
        "models": ["openai/gpt-4o", "anthropic/claude-3.5-sonnet", "google/gemini-pro"],
        "default_base_url": "https://openrouter.ai/api/v1",
    },
    {
        "id": "deepseek",
        "name": "DeepSeek",
        "models": ["deepseek-chat", "deepseek-coder"],
        "default_base_url": "https://api.deepseek.com",
    },
]


class ValidateRequest(BaseModel):
    provider: str
    api_key: str
    base_url: Optional[str] = None
    model_name: Optional[str] = None


class ValidateResponse(BaseModel):
    valid: bool
    message: str
    models: list[str] = []


@router.get("/providers")
async def get_providers():
    return SUPPORTED_PROVIDERS


@router.post("/validate", response_model=ValidateResponse)
async def validate_api_key(request: ValidateRequest):
    logger.info(f"验证 API Key: provider={request.provider}")

    provider_info = None
    for p in SUPPORTED_PROVIDERS:
        if p["id"] == request.provider:
            provider_info = p
            break

    if not provider_info:
        return ValidateResponse(
            valid=False,
            message=f"不支持的提供商: {request.provider}",
        )

    model = request.model_name or provider_info["models"][0]
    base_url = request.base_url or provider_info["default_base_url"]

    try:
        response = await chat(
            model=model,
            messages=[{"role": "user", "content": "Hi"}],
            api_key=request.api_key,
            base_url=base_url if base_url else None,
            temperature=0,
            max_tokens=5,
        )
        return ValidateResponse(
            valid=True,
            message="API Key 验证成功",
            models=provider_info["models"],
        )
    except Exception as e:
        logger.warning(f"API Key 验证失败: {e}")
        return ValidateResponse(
            valid=False,
            message=f"API Key 验证失败: {str(e)[:200]}",
        )
