from typing import TypedDict, Optional


class AgentState(TypedDict):
    task_description: str
    plan: list
    current_step_index: int
    history: list
    short_term_memory: list
    working_memory: dict
    iteration_count: int
    max_iterations: int
    status: str
    final_result: Optional[str]
    current_thinking: str
    current_action: Optional[dict]
    llm_config: dict
