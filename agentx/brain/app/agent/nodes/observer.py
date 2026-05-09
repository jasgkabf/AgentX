import json
from loguru import logger

from app.models.state import AgentState


async def observer_node(state: AgentState) -> dict:
    logger.info("观察节点启动 - 处理执行结果")

    current_action = state.get("current_action")
    if not current_action:
        logger.warning("观察节点: 无当前动作可观察")
        return {
            "status": state.get("status", "thinking"),
        }

    history = list(state.get("history", []))
    short_term_memory = list(state.get("short_term_memory", []))

    observation_entry = {
        "action_type": current_action.get("name", "unknown"),
        "action_params": current_action.get("arguments", {}),
        "observation": state.get("working_memory", {}).get("last_observation", "无观察结果"),
        "success": state.get("working_memory", {}).get("last_success", True),
    }

    history.append(observation_entry)

    assistant_msg = {
        "role": "assistant",
        "content": f"执行了 {current_action['name']}: {json.dumps(current_action.get('arguments', {}), ensure_ascii=False)[:200]}",
    }
    user_msg = {
        "role": "user",
        "content": f"执行结果: {observation_entry['observation'][:500]}",
    }
    short_term_memory.extend([assistant_msg, user_msg])

    if len(short_term_memory) > 100:
        short_term_memory = short_term_memory[-100:]

    logger.info(
        f"观察节点: 记录动作 {current_action['name']}, "
        f"成功={observation_entry['success']}, "
        f"历史记录数={len(history)}"
    )

    return {
        "history": history,
        "short_term_memory": short_term_memory,
        "current_action": None,
        "status": "reflecting",
    }
