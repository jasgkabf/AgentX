import json
from typing import Optional
from fastapi import APIRouter, HTTPException
from loguru import logger

from app.models.schemas import BrainRequest, BrainResponse, ToolCall, ToolDef
from app.agent.graph import agent_graph
from app.agent.tools.registry import get_all_tools
from app.core.config import settings

router = APIRouter(prefix="/api/agent", tags=["agent"])

_sessions: dict = {}


def _get_or_create_session(session_id: str) -> dict:
    if session_id not in _sessions:
        _sessions[session_id] = {
            "short_term_memory": [],
            "working_memory": {},
        }
    return _sessions[session_id]


@router.post("/think", response_model=BrainResponse)
async def think(request: BrainRequest):
    logger.info(f"收到思考请求: task_id={request.task_id}, session_id={request.session_id}")

    session = _get_or_create_session(request.session_id)

    history_dicts = [h.model_dump() for h in request.history]

    llm_config = request.llm_config.model_dump()

    initial_state = {
        "task_description": request.task_description,
        "plan": [],
        "current_step_index": 0,
        "history": history_dicts,
        "short_term_memory": session["short_term_memory"],
        "working_memory": session["working_memory"],
        "iteration_count": request.iteration,
        "max_iterations": settings.MAX_ITERATIONS,
        "status": "thinking",
        "final_result": None,
        "current_thinking": "",
        "current_action": None,
        "llm_config": llm_config,
    }

    try:
        result_state = await agent_graph.ainvoke(initial_state)
    except Exception as e:
        logger.error(f"智能体执行失败: {e}")
        raise HTTPException(status_code=500, detail=f"智能体执行失败: {str(e)}")

    session["short_term_memory"] = result_state.get("short_term_memory", [])
    session["working_memory"] = result_state.get("working_memory", {})

    action = None
    current_action = result_state.get("current_action")
    if current_action:
        action = ToolCall(
            name=current_action.get("name", ""),
            arguments=current_action.get("arguments", {}),
        )

    status = result_state.get("status", "thinking")
    if status == "acting":
        status = "acting"
    elif status == "reflecting":
        status = "thinking"

    token_usage = result_state.get("working_memory", {}).get("last_token_usage", {})

    response = BrainResponse(
        task_id=request.task_id,
        thinking=result_state.get("current_thinking", ""),
        action=action,
        result=result_state.get("final_result"),
        status=status,
        token_usage=token_usage,
    )

    logger.info(
        f"思考完成: task_id={request.task_id}, status={status}, "
        f"has_action={action is not None}"
    )

    return response


@router.post("/execute", response_model=BrainResponse)
async def execute(request: BrainRequest):
    logger.info(f"收到执行请求: task_id={request.task_id}")

    session = _get_or_create_session(request.session_id)

    history_dicts = [h.model_dump() for h in request.history]
    llm_config = request.llm_config.model_dump()

    last_observation = request.history[-1] if request.history else None

    working_memory = session["working_memory"].copy()
    if last_observation:
        working_memory["last_observation"] = last_observation.observation
        working_memory["last_success"] = last_observation.success

    initial_state = {
        "task_description": request.task_description,
        "plan": [],
        "current_step_index": 0,
        "history": history_dicts,
        "short_term_memory": session["short_term_memory"],
        "working_memory": working_memory,
        "iteration_count": request.iteration,
        "max_iterations": settings.MAX_ITERATIONS,
        "status": "thinking",
        "final_result": None,
        "current_thinking": "",
        "current_action": None,
        "llm_config": llm_config,
    }

    try:
        result_state = await agent_graph.ainvoke(initial_state)
    except Exception as e:
        logger.error(f"智能体执行失败: {e}")
        raise HTTPException(status_code=500, detail=f"智能体执行失败: {str(e)}")

    session["short_term_memory"] = result_state.get("short_term_memory", [])
    session["working_memory"] = result_state.get("working_memory", {})

    action = None
    current_action = result_state.get("current_action")
    if current_action:
        action = ToolCall(
            name=current_action.get("name", ""),
            arguments=current_action.get("arguments", {}),
        )

    status = result_state.get("status", "thinking")
    token_usage = result_state.get("working_memory", {}).get("last_token_usage", {})

    response = BrainResponse(
        task_id=request.task_id,
        thinking=result_state.get("current_thinking", ""),
        action=action,
        result=result_state.get("final_result"),
        status=status,
        token_usage=token_usage,
    )

    return response


@router.get("/tools", response_model=list[ToolDef])
async def get_tools():
    tools = get_all_tools()
    result = []
    for tool in tools:
        func = tool["function"]
        result.append(
            ToolDef(
                name=func["name"],
                description=func["description"],
                parameters=func["parameters"],
            )
        )
    return result
