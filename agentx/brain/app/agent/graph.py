from langgraph.graph import StateGraph, END
from loguru import logger

from app.models.state import AgentState
from app.agent.nodes.planner import planner_node
from app.agent.nodes.observer import observer_node
from app.agent.nodes.reflector import reflector_node


def route_after_planner(state: AgentState) -> str:
    status = state.get("status", "thinking")
    current_action = state.get("current_action")

    if status == "failed":
        logger.info("路由: 规划失败 -> END")
        return "end"
    if status == "completed":
        logger.info("路由: 任务完成 -> END")
        return "end"
    if current_action:
        logger.info("路由: 有动作待执行 -> observer")
        return "observer"
    logger.info("路由: 无动作 -> END")
    return "end"


def route_after_reflector(state: AgentState) -> str:
    status = state.get("status", "thinking")

    if status == "completed":
        logger.info("路由: 反思判定完成 -> END")
        return "end"
    if status == "failed":
        logger.info("路由: 反思判定失败 -> END")
        return "end"
    logger.info("路由: 反思判定继续 -> planner")
    return "planner"


def create_agent_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    graph.add_node("planner", planner_node)
    graph.add_node("observer", observer_node)
    graph.add_node("reflector", reflector_node)

    graph.set_entry_point("planner")

    graph.add_conditional_edges(
        "planner",
        route_after_planner,
        {
            "observer": "observer",
            "end": END,
        },
    )

    graph.add_edge("observer", "reflector")

    graph.add_conditional_edges(
        "reflector",
        route_after_reflector,
        {
            "planner": "planner",
            "end": END,
        },
    )

    compiled = graph.compile()
    logger.info("LangGraph 智能体图已编译完成")
    return compiled


agent_graph = create_agent_graph()
