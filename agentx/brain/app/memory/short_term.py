from collections import deque
from typing import Optional
from loguru import logger


class ShortTermMemory:
    def __init__(self, max_size: int = 50):
        self._max_size = max_size
        self._messages: deque = deque(maxlen=max_size)

    def add(self, role: str, content: str, metadata: Optional[dict] = None) -> None:
        message = {"role": role, "content": content}
        if metadata:
            message["metadata"] = metadata
        self._messages.append(message)
        logger.debug(f"短期记忆添加: role={role}, content_len={len(content)}")

    def get_messages(self, limit: Optional[int] = None) -> list:
        messages = list(self._messages)
        if limit and limit > 0:
            messages = messages[-limit:]
        return messages

    def get_as_chat_messages(self, limit: Optional[int] = None) -> list:
        messages = self.get_messages(limit)
        return [{"role": m["role"], "content": m["content"]} for m in messages]

    def clear(self) -> None:
        self._messages.clear()
        logger.debug("短期记忆已清空")

    @property
    def size(self) -> int:
        return len(self._messages)

    def __len__(self) -> int:
        return len(self._messages)
