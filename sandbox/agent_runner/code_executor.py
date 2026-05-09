import asyncio
import tempfile
import os
from loguru import logger


class CodeExecutor:
    async def execute_python(self, code: str, timeout: int = 60) -> dict:
        try:
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".py", delete=False, prefix="agent_code_"
            ) as f:
                f.write(code)
                temp_path = f.name

            try:
                process = await asyncio.create_subprocess_exec(
                    "python3",
                    temp_path,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )

                try:
                    stdout_bytes, stderr_bytes = await asyncio.wait_for(
                        process.communicate(), timeout=timeout
                    )
                except asyncio.TimeoutError:
                    process.kill()
                    await process.communicate()
                    logger.warning(f"Python 代码执行超时 ({timeout}s)")
                    return {
                        "stdout": "",
                        "stderr": f"代码执行超时，已超过 {timeout} 秒限制",
                        "exit_code": -1,
                        "success": False,
                    }

                stdout = stdout_bytes.decode("utf-8", errors="replace")
                stderr = stderr_bytes.decode("utf-8", errors="replace")
                exit_code = process.returncode

                logger.info(f"Python 代码执行完成, 退出码: {exit_code}")

                return {
                    "stdout": stdout,
                    "stderr": stderr,
                    "exit_code": exit_code,
                    "success": exit_code == 0,
                }

            finally:
                os.unlink(temp_path)

        except Exception as e:
            logger.error(f"Python 代码执行异常: {e}")
            return {
                "stdout": "",
                "stderr": str(e),
                "exit_code": -1,
                "success": False,
            }

    async def execute_javascript(self, code: str, timeout: int = 60) -> dict:
        try:
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".js", delete=False, prefix="agent_code_"
            ) as f:
                f.write(code)
                temp_path = f.name

            try:
                process = await asyncio.create_subprocess_exec(
                    "node",
                    temp_path,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )

                try:
                    stdout_bytes, stderr_bytes = await asyncio.wait_for(
                        process.communicate(), timeout=timeout
                    )
                except asyncio.TimeoutError:
                    process.kill()
                    await process.communicate()
                    logger.warning(f"JavaScript 代码执行超时 ({timeout}s)")
                    return {
                        "stdout": "",
                        "stderr": f"代码执行超时，已超过 {timeout} 秒限制",
                        "exit_code": -1,
                        "success": False,
                    }

                stdout = stdout_bytes.decode("utf-8", errors="replace")
                stderr = stderr_bytes.decode("utf-8", errors="replace")
                exit_code = process.returncode

                logger.info(f"JavaScript 代码执行完成, 退出码: {exit_code}")

                return {
                    "stdout": stdout,
                    "stderr": stderr,
                    "exit_code": exit_code,
                    "success": exit_code == 0,
                }

            finally:
                os.unlink(temp_path)

        except Exception as e:
            logger.error(f"JavaScript 代码执行异常: {e}")
            return {
                "stdout": "",
                "stderr": str(e),
                "exit_code": -1,
                "success": False,
            }
