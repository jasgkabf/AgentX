from loguru import logger

from app.models.state import AgentState
from app.core.llm import chat
from app.agent.prompts.reflector import REFLECTOR_PROMPT


def _get_model_from_config(llm_config: dict) -> str:
    provider = llm_config.get("provider", "openai")
    model_name = llm_config.get("model_name", "gpt-4o")
    provider_model_map = {
        "openai": model_name,
        "anthropic": model_name,
        "azure": f"azure/{model_name}",
        "openrouter": f"openrouter/{model_name}",
    }
    return provider_model_map.get(provider, model_name)


async def reflector_node(state: AgentState) -> dict:
    logger.info("反思节点启动 - 评估任务进度")

    history = state.get("history", [])
    iteration_count = state["iteration_count"]
    max_iterations = state["max_iterations"]
    llm_config = state.get("llm_config", {})

    last_action = history[-1] if history else {}
    last_action_type = last_action.get("action_type", "无")
    last_action_params = last_action.get("action_params", {})
    last_observation = last_action.get("observation", "无")
    last_success = last_action.get("success", True)

    history_text = "\n".join(
        f"{i + 1}. [{'✓' if h.get('success', True) else '✗'}] {h.get('action_type', 'unknown')}: {h.get('observation', '')[:150]}"
        for i, h in enumerate(history)
    ) if history else "暂无历史"

    reflector_message = REFLECTOR_PROMPT.format(
        task_description=state["task_description"],
        history=history_text,
        last_action_type=last_action_type,
        last_action_params=str(last_action_params),
        last_observation=last_observation[:500],
        last_success=last_success,
        iteration=iteration_count,
        max_iterations=max_iterations,
    )

    messages = [
        {"role": "system", "content": "你是一个任务反思专家，擅长评估任务进度和调整策略。"},
        {"role": "user", "content": reflector_message},
    ]

    model = _get_model_from_config(llm_config)
    api_key = llm_config.get("api_key")
    base_url = llm_config.get("base_url")
    temperature = llm_config.get("temperature", 0.1)
    max_tokens = llm_config.get("max_tokens", 2048)

    try:
        response = await chat(
            model=model,
            messages=messages,
            api_key=api_key,
            base_url=base_url,
            temperature=temperature,
            max_tokens=max_tokens,
        )
    except Exception as e:
        logger.error(f"反思节点 LLM 调用失败: {e}")
        if iteration_count >= max_iterations:
            return {
                "status": "failed",
                "final_result": f"反思失败且已达最大迭代次数: {str(e)}",
            }
        return {"status": "thinking"}

    reflection = response.get("content", "")
    logger.info(f"反思结果: {reflection[:200]}")

    if iteration_count >= max_iterations:
        logger.warning(f"已达最大迭代次数 {max_iterations}")
        return {
            "status": "failed",
            "final_result": f"已达最大迭代次数 ({max_iterations})，任务未完成。最后反思: {reflection[:300]}",
        }

    if "COMPLETED:" in reflection:
        result = reflection.split("COMPLETED:", 1)[1].strip()
        logger.info(f"反思判定任务完成: {result[:100]}")
        return {
            "status": "completed",
            "final_result": result,
        }

    if "FAILED:" in reflection:
        reason = reflection.split("FAILED:", 1)[1].strip()
        logger.warning(f"反思判定任务失败: {reason[:100]}")
        return {
            "status": "failed",
            "final_result": reason,
        }

    logger.info("反思判定需要继续执行")
    return {
        "status": "thinking",
        "current_thinking": reflection,
    }
