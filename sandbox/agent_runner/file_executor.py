import os
import glob
from pathlib import Path
from loguru import logger

WORKSPACE_ROOT = "/workspace"


def _validate_path(path: str) -> str:
    resolved = os.path.realpath(path)
    workspace_root = os.path.realpath(WORKSPACE_ROOT)
    if not resolved.startswith(workspace_root):
        raise PermissionError(f"路径超出工作空间范围: {path}")
    return resolved


class FileExecutor:
    async def read(
        self, path: str, start_line: int = None, end_line: int = None
    ) -> dict:
        try:
            resolved = _validate_path(path)

            if not os.path.exists(resolved):
                return {"success": False, "error": f"文件不存在: {path}", "content": None}

            if os.path.isdir(resolved):
                return {"success": False, "error": f"路径是目录而非文件: {path}", "content": None}

            with open(resolved, "r", encoding="utf-8", errors="replace") as f:
                lines = f.readlines()

            total_lines = len(lines)

            if start_line is not None:
                start_idx = max(0, start_line - 1)
            else:
                start_idx = 0

            if end_line is not None:
                end_idx = min(total_lines, end_line)
            else:
                end_idx = total_lines

            selected_lines = lines[start_idx:end_idx]
            content = "".join(selected_lines)

            logger.info(f"读取文件: {path}, 行 {start_idx+1}-{end_idx}/{total_lines}")

            return {
                "success": True,
                "content": content,
                "total_lines": total_lines,
                "start_line": start_idx + 1,
                "end_line": end_idx,
                "error": None,
            }

        except PermissionError as e:
            logger.warning(f"路径安全检查失败: {path}, 错误: {e}")
            return {"success": False, "error": str(e), "content": None}
        except Exception as e:
            logger.error(f"读取文件失败: {path}, 错误: {e}")
            return {"success": False, "error": str(e), "content": None}

    async def write(self, path: str, content: str, mode: str = "overwrite") -> dict:
        try:
            resolved = _validate_path(path)

            parent_dir = os.path.dirname(resolved)
            os.makedirs(parent_dir, exist_ok=True)

            if mode == "append":
                with open(resolved, "a", encoding="utf-8") as f:
                    f.write(content)
            else:
                with open(resolved, "w", encoding="utf-8") as f:
                    f.write(content)

            logger.info(f"写入文件: {path}, 模式: {mode}, 大小: {len(content)} 字符")

            return {
                "success": True,
                "path": resolved,
                "size": len(content),
                "mode": mode,
                "error": None,
            }

        except PermissionError as e:
            logger.warning(f"路径安全检查失败: {path}, 错误: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"写入文件失败: {path}, 错误: {e}")
            return {"success": False, "error": str(e)}

    async def list_dir(self, path: str, pattern: str = "*") -> dict:
        try:
            resolved = _validate_path(path)

            if not os.path.exists(resolved):
                return {"success": False, "error": f"目录不存在: {path}", "entries": None}

            if not os.path.isdir(resolved):
                return {"success": False, "error": f"路径不是目录: {path}", "entries": None}

            search_pattern = os.path.join(resolved, pattern)
            matched = glob.glob(search_pattern)

            entries = []
            for item in sorted(matched):
                name = os.path.basename(item)
                is_dir = os.path.isdir(item)
                size = 0 if is_dir else os.path.getsize(item)
                entries.append({
                    "name": name,
                    "path": item,
                    "is_dir": is_dir,
                    "size": size,
                })

            logger.info(f"列出目录: {path}, 模式: {pattern}, 条目数: {len(entries)}")

            return {
                "success": True,
                "entries": entries,
                "count": len(entries),
                "error": None,
            }

        except PermissionError as e:
            logger.warning(f"路径安全检查失败: {path}, 错误: {e}")
            return {"success": False, "error": str(e), "entries": None}
        except Exception as e:
            logger.error(f"列出目录失败: {path}, 错误: {e}")
            return {"success": False, "error": str(e), "entries": None}

    async def delete(self, path: str) -> dict:
        try:
            resolved = _validate_path(path)

            if not os.path.exists(resolved):
                return {"success": False, "error": f"路径不存在: {path}"}

            if os.path.isdir(resolved):
                import shutil
                shutil.rmtree(resolved)
                logger.info(f"删除目录: {path}")
            else:
                os.remove(resolved)
                logger.info(f"删除文件: {path}")

            return {"success": True, "error": None}

        except PermissionError as e:
            logger.warning(f"路径安全检查失败: {path}, 错误: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"删除失败: {path}, 错误: {e}")
            return {"success": False, "error": str(e)}

    async def exists(self, path: str) -> dict:
        try:
            resolved = _validate_path(path)
            exists = os.path.exists(resolved)
            is_file = os.path.isfile(resolved) if exists else False
            is_dir = os.path.isdir(resolved) if exists else False

            return {
                "success": True,
                "exists": exists,
                "is_file": is_file,
                "is_dir": is_dir,
                "error": None,
            }

        except PermissionError as e:
            logger.warning(f"路径安全检查失败: {path}, 错误: {e}")
            return {"success": False, "error": str(e), "exists": False}
        except Exception as e:
            logger.error(f"检查路径失败: {path}, 错误: {e}")
            return {"success": False, "error": str(e), "exists": False}
