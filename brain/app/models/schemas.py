from typing import Optional, Literal
from pydantic import BaseModel, Field


class ToolCall(BaseModel):
    name: str = Field(..., description="工具名称")
    arguments: dict = Field(default_factory=dict, description="工具参数")


class ActionObservation(BaseModel):
    action_type: str = Field(..., description="动作类型")
    action_params: dict = Field(default_factory=dict, description="动作参数")
    observation: str = Field(..., description="观察结果")
    success: bool = Field(True, description="是否成功")


class Step(BaseModel):
    step_number: int = Field(..., description="步骤编号")
    description: str = Field(..., description="步骤描述")
    status: Literal["pending", "in_progress", "completed", "failed"] = "pending"


class LLMConfig(BaseModel):
    provider: str = Field("openai", description="模型提供商: openai/anthropic/azure/openrouter")
    model_name: str = Field("gpt-4o", description="模型名称")
    api_key: Optional[str] = Field(None, description="API Key")
    base_url: Optional[str] = Field(None, description="自定义 API 地址")
    temperature: float = Field(0.1, description="温度参数")
    max_tokens: int = Field(4096, description="最大 token 数")


class BrainRequest(BaseModel):
    task_id: str = Field(..., description="任务 ID")
    session_id: str = Field(..., description="会话 ID")
    task_description: str = Field(..., description="任务描述")
    history: list[ActionObservation] = Field(default_factory=list, description="历史动作观察")
    available_tools: list[dict] = Field(default_factory=list, description="可用工具列表")
    llm_config: LLMConfig = Field(..., description="LLM 配置")
    iteration: int = Field(0, description="当前迭代次数")


class BrainResponse(BaseModel):
    task_id: str = Field(..., description="任务 ID")
    thinking: str = Field("", description="思考过程")
    action: Optional[ToolCall] = Field(None, description="要执行的动作")
    result: Optional[str] = Field(None, description="最终结果")
    status: Literal["thinking", "acting", "completed", "failed"] = Field("thinking", description="状态")
    token_usage: dict = Field(default_factory=dict, description="Token 使用量")


class ToolDef(BaseModel):
    name: str = Field(..., description="工具名称")
    description: str = Field(..., description="工具描述")
    parameters: dict = Field(default_factory=dict, description="参数 JSON Schema")
