import asyncio
from loguru import logger


BLOCKED_COMMANDS = [
    "rm -rf /",
    "mkfs",
    "dd if=",
    ":(){ :|:& };:",
    "format",
    "del /f /s /q C:",
]


class ShellExecutor:
    async def execute(
        self, command: str, timeout: int = 120, cwd: str = "/workspace"
    ) -> dict:
        for blocked in BLOCKED_COMMANDS:
            if blocked in command:
                logger.warning(f"阻止执行危险命令: {command}")
                return {
                    "stdout": "",
                    "stderr": f"命令被安全策略阻止: 包含禁止模式 '{blocked}'",
                    "exit_code": -1,
                    "success": False,
                }

        try:
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=cwd,
            )

            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    process.communicate(), timeout=timeout
                )
            except asyncio.TimeoutError:
                process.kill()
                await process.communicate()
                logger.warning(f"命令执行超时 ({timeout}s): {command}")
                return {
                    "stdout": "",
                    "stderr": f"命令执行超时，已超过 {timeout} 秒限制",
                    "exit_code": -1,
                    "success": False,
                }

            stdout = stdout_bytes.decode("utf-8", errors="replace")
            stderr = stderr_bytes.decode("utf-8", errors="replace")
            exit_code = process.returncode

            logger.info(f"命令执行完成: {command}, 退出码: {exit_code}")

            return {
                "stdout": stdout,
                "stderr": stderr,
                "exit_code": exit_code,
                "success": exit_code == 0,
            }

        except Exception as e:
            logger.error(f"命令执行异常: {command}, 错误: {e}")
            return {
                "stdout": "",
                "stderr": str(e),
                "exit_code": -1,
                "success": False,
            }
