from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional

from .shell_executor import ShellExecutor
from .file_executor import FileExecutor
from .browser_executor import BrowserExecutor
from .search_executor import SearchExecutor
from .code_executor import CodeExecutor

router = APIRouter()

shell_executor = ShellExecutor()
file_executor = FileExecutor()
browser_executor: Optional[BrowserExecutor] = None
search_executor: Optional[SearchExecutor] = None
code_executor = CodeExecutor()


def set_browser_executor(browser: BrowserExecutor):
    global browser_executor, search_executor
    browser_executor = browser
    search_executor = SearchExecutor(browser)


class ShellRequest(BaseModel):
    command: str
    timeout: int = Field(default=120, ge=1, le=600)
    cwd: str = "/workspace"


class FileReadRequest(BaseModel):
    path: str
    start_line: Optional[int] = None
    end_line: Optional[int] = None


class FileWriteRequest(BaseModel):
    path: str
    content: str
    mode: str = Field(default="overwrite", pattern="^(overwrite|append)$")


class FileListRequest(BaseModel):
    path: str
    pattern: str = "*"


class FileDeleteRequest(BaseModel):
    path: str


class FileExistsRequest(BaseModel):
    path: str


class BrowserNavigateRequest(BaseModel):
    url: str


class BrowserClickRequest(BaseModel):
    selector: str


class BrowserTypeRequest(BaseModel):
    selector: str
    text: str
    submit: bool = False


class BrowserExtractRequest(BaseModel):
    selector: str = "body"


class BrowserScrollRequest(BaseModel):
    direction: str = Field(default="down", pattern="^(up|down)$")
    amount: int = Field(default=300, ge=1, le=5000)


class SearchRequest(BaseModel):
    query: str
    num_results: int = Field(default=10, ge=1, le=50)


class SearchAndExtractRequest(BaseModel):
    query: str
    num_results: int = Field(default=5, ge=1, le=20)


class CodeRequest(BaseModel):
    language: str = Field(pattern="^(python|javascript)$")
    code: str
    timeout: int = Field(default=60, ge=1, le=300)


@router.post("/api/execute/shell")
async def execute_shell(req: ShellRequest):
    result = await shell_executor.execute(req.command, req.timeout, req.cwd)
    return {"success": result["success"], "result": result, "error": result.get("stderr") if not result["success"] else None}


@router.post("/api/execute/file/read")
async def execute_file_read(req: FileReadRequest):
    result = await file_executor.read(req.path, req.start_line, req.end_line)
    return {"success": result["success"], "result": result, "error": result.get("error")}


@router.post("/api/execute/file/write")
async def execute_file_write(req: FileWriteRequest):
    result = await file_executor.write(req.path, req.content, req.mode)
    return {"success": result["success"], "result": result, "error": result.get("error")}


@router.post("/api/execute/file/list")
async def execute_file_list(req: FileListRequest):
    result = await file_executor.list_dir(req.path, req.pattern)
    return {"success": result["success"], "result": result, "error": result.get("error")}


@router.post("/api/execute/file/delete")
async def execute_file_delete(req: FileDeleteRequest):
    result = await file_executor.delete(req.path)
    return {"success": result["success"], "result": result, "error": result.get("error")}


@router.post("/api/execute/browser/navigate")
async def execute_browser_navigate(req: BrowserNavigateRequest):
    if not browser_executor:
        return {"success": False, "result": None, "error": "浏览器未初始化"}
    result = await browser_executor.navigate(req.url)
    return result


@router.post("/api/execute/browser/click")
async def execute_browser_click(req: BrowserClickRequest):
    if not browser_executor:
        return {"success": False, "result": None, "error": "浏览器未初始化"}
    result = await browser_executor.click(req.selector)
    return result


@router.post("/api/execute/browser/type")
async def execute_browser_type(req: BrowserTypeRequest):
    if not browser_executor:
        return {"success": False, "result": None, "error": "浏览器未初始化"}
    result = await browser_executor.type_text(req.selector, req.text, req.submit)
    return result


@router.post("/api/execute/browser/screenshot")
async def execute_browser_screenshot():
    if not browser_executor:
        return {"success": False, "result": None, "error": "浏览器未初始化"}
    result = await browser_executor.screenshot()
    return result


@router.post("/api/execute/browser/extract")
async def execute_browser_extract(req: BrowserExtractRequest):
    if not browser_executor:
        return {"success": False, "result": None, "error": "浏览器未初始化"}
    result = await browser_executor.extract(req.selector)
    return result


@router.post("/api/execute/browser/scroll")
async def execute_browser_scroll(req: BrowserScrollRequest):
    if not browser_executor:
        return {"success": False, "result": None, "error": "浏览器未初始化"}
    result = await browser_executor.scroll(req.direction, req.amount)
    return result


@router.post("/api/execute/browser/back")
async def execute_browser_back():
    if not browser_executor:
        return {"success": False, "result": None, "error": "浏览器未初始化"}
    result = await browser_executor.go_back()
    return result


@router.post("/api/execute/search")
async def execute_search(req: SearchRequest):
    if not search_executor:
        return {"success": False, "result": None, "error": "搜索执行器未初始化"}
    result = await search_executor.search(req.query, req.num_results)
    return result


@router.post("/api/execute/search/extract")
async def execute_search_and_extract(req: SearchAndExtractRequest):
    if not search_executor:
        return {"success": False, "result": None, "error": "搜索执行器未初始化"}
    result = await search_executor.search_and_extract(req.query, req.num_results)
    return result


@router.post("/api/execute/code")
async def execute_code(req: CodeRequest):
    if req.language == "python":
        result = await code_executor.execute_python(req.code, req.timeout)
    else:
        result = await code_executor.execute_javascript(req.code, req.timeout)
    return {"success": result["success"], "result": result, "error": result.get("stderr") if not result["success"] else None}
