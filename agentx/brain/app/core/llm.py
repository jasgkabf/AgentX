import json
import asyncio
from typing import Optional

import litellm
from loguru import logger

from app.core.config import settings

litellm.suppress_debug_info = True


async def chat(
    model: str,
    messages: list,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    temperature: float = 0.1,
    max_tokens: int = 4096,
    tools: Optional[list] = None,
) -> dict:
    max_retries = 3
    last_error = None

    for attempt in range(max_retries):
        try:
            kwargs = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "timeout": settings.DEFAULT_TIMEOUT,
            }

            if api_key:
                kwargs["api_key"] = api_key
            if base_url:
                kwargs["api_base"] = base_url
            if tools:
                kwargs["tools"] = tools

            logger.info(f"LLM 调用: model={model}, attempt={attempt + 1}")

            response = await litellm.acompletion(**kwargs)

            message = response.choices[0].message
            result = {
                "content": message.content or "",
                "tool_calls": None,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                    "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                    "total_tokens": response.usage.total_tokens if response.usage else 0,
                },
            }

            if message.tool_calls:
                result["tool_calls"] = []
                for tc in message.tool_calls:
                    args = {}
                    if tc.function.arguments:
                        try:
                            args = json.loads(tc.function.arguments)
                        except json.JSONDecodeError:
                            args = {"raw_arguments": tc.function.arguments}
                    result["tool_calls"].append(
                        {
                            "id": tc.id,
                            "name": tc.function.name,
                            "arguments": args,
                        }
                    )

            logger.info(
                f"LLM 响应: tokens={result['usage']['total_tokens']}, "
                f"tool_calls={len(result['tool_calls']) if result['tool_calls'] else 0}"
            )
            return result

        except Exception as e:
            last_error = e
            logger.warning(f"LLM 调用失败 (attempt={attempt + 1}/{max_retries}): {str(e)}")
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                await asyncio.sleep(wait_time)

    logger.error(f"LLM 调用最终失败: {str(last_error)}")
    raise RuntimeError(f"LLM 调用失败，已重试 {max_retries} 次: {str(last_error)}")
