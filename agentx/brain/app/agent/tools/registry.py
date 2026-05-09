from typing import Optional


TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "shell_execute",
            "description": "在终端中执行 Shell 命令。可以执行任何合法的 Shell 命令，包括安装软件包、运行脚本、管理文件等。命令将在 /workspace 目录下执行。",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "要执行的 Shell 命令",
                    },
                    "timeout": {
                        "type": "integer",
                        "description": "命令超时时间（秒），默认 30",
                        "default": 30,
                    },
                    "cwd": {
                        "type": "string",
                        "description": "工作目录，默认 /workspace",
                        "default": "/workspace",
                    },
                },
                "required": ["command"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "file_read",
            "description": "读取文件内容。支持文本文件的读取，可以指定行范围。返回文件内容字符串。",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "文件路径（绝对路径或相对路径）",
                    },
                    "offset": {
                        "type": "integer",
                        "description": "起始行号（从 1 开始），默认 1",
                        "default": 1,
                    },
                    "limit": {
                        "type": "integer",
                        "description": "读取行数，默认读取全部",
                        "default": -1,
                    },
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "file_write",
            "description": "写入文件内容。如果文件不存在则创建，如果存在则覆盖。自动创建所需的父目录。",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "文件路径（绝对路径或相对路径）",
                    },
                    "content": {
                        "type": "string",
                        "description": "要写入的文件内容",
                    },
                    "append": {
                        "type": "boolean",
                        "description": "是否追加模式，默认 False（覆盖）",
                        "default": False,
                    },
                },
                "required": ["path", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "file_list",
            "description": "列出目录下的文件和子目录。返回目录内容列表，包含文件名、类型和大小。",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "目录路径，默认 /workspace",
                        "default": "/workspace",
                    },
                    "recursive": {
                        "type": "boolean",
                        "description": "是否递归列出子目录，默认 False",
                        "default": False,
                    },
                    "pattern": {
                        "type": "string",
                        "description": "文件名匹配模式（glob），如 *.py",
                        "default": "*",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "browser_navigate",
            "description": "导航浏览器到指定 URL。会等待页面加载完成后返回页面标题和基本信息。",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "要导航到的 URL 地址",
                    },
                    "wait_seconds": {
                        "type": "integer",
                        "description": "页面加载等待时间（秒），默认 3",
                        "default": 3,
                    },
                },
                "required": ["url"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "browser_click",
            "description": "在当前页面点击指定元素。通过 CSS 选择器或 XPath 定位元素。",
            "parameters": {
                "type": "object",
                "properties": {
                    "selector": {
                        "type": "string",
                        "description": "CSS 选择器或 XPath 表达式",
                    },
                    "selector_type": {
                        "type": "string",
                        "enum": ["css", "xpath"],
                        "description": "选择器类型，默认 css",
                        "default": "css",
                    },
                    "wait_seconds": {
                        "type": "integer",
                        "description": "点击后等待时间（秒），默认 2",
                        "default": 2,
                    },
                },
                "required": ["selector"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "browser_type",
            "description": "在当前页面的输入框中输入文本。先定位元素，然后清空并输入指定文本。",
            "parameters": {
                "type": "object",
                "properties": {
                    "selector": {
                        "type": "string",
                        "description": "CSS 选择器或 XPath 表达式",
                    },
                    "text": {
                        "type": "string",
                        "description": "要输入的文本内容",
                    },
                    "selector_type": {
                        "type": "string",
                        "enum": ["css", "xpath"],
                        "description": "选择器类型，默认 css",
                        "default": "css",
                    },
                    "press_enter": {
                        "type": "boolean",
                        "description": "输入完成后是否按回车键，默认 False",
                        "default": False,
                    },
                },
                "required": ["selector", "text"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "browser_screenshot",
            "description": "截取当前浏览器页面的截图。返回截图的保存路径。",
            "parameters": {
                "type": "object",
                "properties": {
                    "full_page": {
                        "type": "boolean",
                        "description": "是否截取完整页面（包括滚动区域），默认 False",
                        "default": False,
                    },
                    "save_path": {
                        "type": "string",
                        "description": "截图保存路径，默认自动生成",
                        "default": "",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "browser_extract",
            "description": "从当前页面提取文本内容。可以提取整个页面或指定元素的文本。",
            "parameters": {
                "type": "object",
                "properties": {
                    "selector": {
                        "type": "string",
                        "description": "CSS 选择器，为空则提取整个页面",
                        "default": "",
                    },
                    "extract_type": {
                        "type": "string",
                        "enum": ["text", "html", "links", "tables"],
                        "description": "提取类型：text(纯文本)、html(HTML)、links(链接列表)、tables(表格数据)",
                        "default": "text",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "code_execute",
            "description": "执行 Python 代码。代码在一个独立的沙箱环境中运行，支持标准库和常见第三方库。执行结果（stdout、stderr、返回值）会被返回。",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "要执行的 Python 代码",
                    },
                    "timeout": {
                        "type": "integer",
                        "description": "执行超时时间（秒），默认 60",
                        "default": 60,
                    },
                },
                "required": ["code"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "使用 Bing 搜索引擎搜索互联网信息。返回搜索结果列表，包含标题、链接和摘要。",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "搜索关键词",
                    },
                    "num_results": {
                        "type": "integer",
                        "description": "返回结果数量，默认 10",
                        "default": 10,
                    },
                    "language": {
                        "type": "string",
                        "description": "搜索语言，如 zh-CN, en-US",
                        "default": "zh-CN",
                    },
                },
                "required": ["query"],
            },
        },
    },
]


def get_all_tools() -> list:
    return TOOL_DEFINITIONS


def get_tool_by_name(name: str) -> Optional[dict]:
    for tool in TOOL_DEFINITIONS:
        if tool["function"]["name"] == name:
            return tool
    return None


def get_tools_summary() -> str:
    lines = []
    for tool in TOOL_DEFINITIONS:
        func = tool["function"]
        params = func["parameters"].get("properties", {})
        required = func["parameters"].get("required", [])
        param_strs = []
        for pname, pinfo in params.items():
            req = "必填" if pname in required else "可选"
            ptype = pinfo.get("type", "any")
            pdesc = pinfo.get("description", "")
            param_strs.append(f"  - {pname} ({ptype}, {req}): {pdesc}")
        lines.append(f"- {func['name']}: {func['description']}")
        if param_strs:
            lines.extend(param_strs)
    return "\n".join(lines)
