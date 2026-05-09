import json
from loguru import logger

from app.models.state import AgentState
from app.core.llm import chat
from app.agent.prompts.system import SYSTEM_PROMPT
from app.agent.prompts.planner import PLANNER_PROMPT
from app.agent.tools.registry import get_all_tools, get_tools_summary


def _build_history_text(history: list) -> str:
    if not history:
        return "暂无执行历史"
    lines = []
    for i, item in enumerate(history, 1):
        success_mark = "✓" if item.get("success", True) else "✗"
        lines.append(
            f"{i}. [{success_mark}] {item.get('action_type', 'unknown')}: "
            f"{item.get('observation', '无结果')[:200]}"
        )
    return "\n".join(lines)


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


async def planner_node(state: AgentState) -> dict:
    logger.info(f"规划节点启动 - 迭代: {state['iteration_count']}/{state['max_iterations']}")

    task_description = state["task_description"]
    history = state.get("history", [])
    iteration_count = state["iteration_count"]
    max_iterations = state["max_iterations"]
    llm_config = state.get("llm_config", {})

    completed_steps = sum(1 for h in history if h.get("success", True))

    planner_message = PLANNER_PROMPT.format(
        task_description=task_description,
        completed_steps=completed_steps,
        iteration=iteration_count,
        max_iterations=max_iterations,
        history=_build_history_text(history),
        available_tools=get_tools_summary(),
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": planner_message},
    ]

    for mem in state.get("short_term_memory", []):
        if mem.get("role") in ("user", "assistant"):
            messages.append(mem)

    tools = get_all_tools()

    model = _get_model_from_config(llm_config)
    api_key = llm_config.get("api_key")
    base_url = llm_config.get("base_url")
    temperature = llm_config.get("temperature", 0.1)
    max_tokens = llm_config.get("max_tokens", 4096)

    try:
        response = await chat(
            model=model,
            messages=messages,
            api_key=api_key,
            base_url=base_url,
            temperature=temperature,
            max_tokens=max_tokens,
            tools=tools,
        )
    except Exception as e:
        logger.error(f"规划节点 LLM 调用失败: {e}")
        return {
            "status": "failed",
            "current_thinking": f"LLM 调用失败: {str(e)}",
            "current_action": None,
            "final_result": f"规划失败: {str(e)}",
        }

    thinking = response.get("content", "")
    tool_calls = response.get("tool_calls")
    usage = response.get("usage", {})

    current_action = None
    if tool_calls and len(tool_calls) > 0:
        tc = tool_calls[0]
        current_action = {
            "name": tc["name"],
            "arguments": tc["arguments"],
            "id": tc.get("id", ""),
        }
        logger.info(f"规划节点产出动作: {tc['name']}({json.dumps(tc['arguments'], ensure_ascii=False)[:100]})")
    else:
        logger.info("规划节点未产出动作，可能任务已完成")

    new_status = "acting" if current_action else "completed"
    if current_action is None and not thinking.strip():
        new_status = "failed"

    final_result = None
    if new_status == "completed":
        final_result = thinking

    return {
        "current_thinking": thinking,
        "current_action": current_action,
        "status": new_status,
        "final_result": final_result,
        "iteration_count": iteration_count + 1,
        "working_memory": {
            **state.get("working_memory", {}),
            "last_token_usage": usage,
        },
    }
