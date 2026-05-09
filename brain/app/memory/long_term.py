import os
from typing import Optional
from loguru import logger

from app.core.config import settings


class LongTermMemory:
    def __init__(self, persist_dir: Optional[str] = None):
        self._persist_dir = persist_dir or settings.CHROMA_PERSIST_DIR
        self._client = None
        self._collection = None
        self._initialized = False

    def _ensure_initialized(self) -> None:
        if self._initialized:
            return
        try:
            import chromadb

            os.makedirs(self._persist_dir, exist_ok=True)
            self._client = chromadb.PersistentClient(path=self._persist_dir)
            self._collection = self._client.get_or_create_collection(
                name="agentx_experience",
                metadata={"description": "AgentX 长期经验记忆"},
            )
            self._initialized = True
            logger.info(f"长期记忆初始化完成: {self._persist_dir}")
        except Exception as e:
            logger.error(f"长期记忆初始化失败: {e}")
            raise

    async def add_experience(
        self,
        task: str,
        action: str,
        result: str,
        success: bool,
        metadata: Optional[dict] = None,
    ) -> str:
        self._ensure_initialized()
        try:
            doc_id = f"exp_{hash(task + action) & 0xFFFFFFFF:08x}"
            document = f"任务: {task}\n动作: {action}\n结果: {result}"
            meta = {
                "task": task[:500],
                "action": action[:200],
                "success": success,
            }
            if metadata:
                meta.update(metadata)

            self._collection.upsert(
                ids=[doc_id],
                documents=[document],
                metadatas=[meta],
            )
            logger.info(f"长期记忆添加经验: {doc_id}")
            return doc_id
        except Exception as e:
            logger.error(f"添加经验失败: {e}")
            raise

    async def search_similar(
        self,
        query: str,
        n_results: int = 5,
    ) -> list:
        self._ensure_initialized()
        try:
            results = self._collection.query(
                query_texts=[query],
                n_results=n_results,
            )
            experiences = []
            if results and results.get("documents"):
                for i, doc in enumerate(results["documents"][0]):
                    meta = results["metadatas"][0][i] if results.get("metadatas") else {}
                    distance = results["distances"][0][i] if results.get("distances") else 0.0
                    experiences.append(
                        {
                            "document": doc,
                            "metadata": meta,
                            "distance": distance,
                        }
                    )
            logger.info(f"长期记忆检索: query='{query[:50]}', 找到 {len(experiences)} 条")
            return experiences
        except Exception as e:
            logger.error(f"检索经验失败: {e}")
            return []

    async def get_stats(self) -> dict:
        self._ensure_initialized()
        try:
            count = self._collection.count()
            return {
                "total_experiences": count,
                "persist_dir": self._persist_dir,
            }
        except Exception as e:
            logger.error(f"获取统计失败: {e}")
            return {"total_experiences": 0, "persist_dir": self._persist_dir, "error": str(e)}
