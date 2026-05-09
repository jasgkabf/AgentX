# AgentX - 类 Manus 智能体系统完整设计文档

> 版本: v1.0 | 日期: 2026-05-09 | 状态: 设计阶段

---

## 一、系统总览

### 1.1 项目定位

构建一个可私有化部署的、类 Manus 的全功能 AI 智能体系统。智能体能够自主控制计算机完成复杂任务，包括网页浏览、终端操作、文件处理、代码编写等全场景覆盖。系统采用前后端分离架构，Web 前端提供可视化控制台，后端通过 Docker 沙箱实现安全的计算机控制。

### 1.2 核心设计原则

- **四层解耦**: 前端展示层 / 调度编排层 / 智能推理层 / 沙箱执行层，各层独立部署、独立扩展
- **大脑与手脚分离**: Python 层只负责思考和决策，Docker 层只负责执行，NestJS 层负责协调
- **多模型自由切换**: 通过 LiteLLM 适配层支持 OpenAI / Claude / 通义千问 / DeepSeek 等任意模型
- **安全隔离**: 所有执行操作在 Docker 容器内完成，不污染宿主机
- **实时可观测**: 全链路 WebSocket 推送，用户可实时看到智能体的思考过程和执行动作

### 1.3 系统架构全景图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        用户浏览器                                    │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    前端 Web 控制台 (Next.js)                   │  │
│  │  任务面板 │ 实时日志 │ 思考可视化 │ 文件浏览 │ 设置中心       │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ REST API + WebSocket
┌──────────────────────────────┼──────────────────────────────────────┐
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              调度编排层 (NestJS) - 全局总指挥                   │  │
│  │                                                               │  │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │  │
│  │  │任务管理  │ │WebSocket │ │BullMQ    │ │权限 & API Key    │  │  │
│  │  │生命周期  │ │实时推送   │ │任务队列   │ │管理模块          │  │  │
│  │  └─────────┘ └──────────┘ └──────────┘ └──────────────────┘  │  │
│  │         │                              │                      │  │
│  │         │    ┌──────────────────┐      │                      │  │
│  │         │    │  会话 & 上下文    │      │                      │  │
│  │         │    │  管理模块         │      │                      │  │
│  │         │    └──────────────────┘      │                      │  │
│  └─────────┼──────────────────────────────┼──────────────────────┘  │
│            │ HTTP/gRPC                    │ HTTP/Docker API        │
│            ▼                              ▼                        │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐   │
│  │ 智能推理层           │    │ 沙箱执行层                      │   │
│  │ (Python FastAPI +   │    │ (Docker Containers)             │   │
│  │  LangGraph)         │    │                                 │   │
│  │                     │    │  ┌───────────┐  ┌────────────┐  │   │
│  │ ┌─────────────────┐ │    │  │ 沙箱实例 A │  │ 沙箱实例 B  │  │   │
│  │ │ LLM 适配层      │ │    │  │           │  │            │  │   │
│  │ │ (LiteLLM)       │ │    │  │ - Shell   │  │ - Shell    │  │   │
│  │ ├─────────────────┤ │    │  │ - Python  │  │ - Python   │  │   │
│  │ │ LangGraph       │ │    │  │ - Node.js │  │ - Node.js  │  │   │
│  │ │ Agent 编排      │ │    │  │ - Playwright│ │ - Playwright│ │   │
│  │ ├─────────────────┤ │    │  └───────────┘  └────────────┘  │   │
│  │ │ 记忆管理        │ │    │                                 │   │
│  │ │ (短期+长期)     │ │    │  每个任务独立容器，执行完销毁     │   │
│  │ ├─────────────────┤ │    └─────────────────────────────────┘   │
│  │ │ 工具注册中心    │ │                                          │
│  │ │ (Tool Registry) │ │    ┌─────────────────────────────────┐   │
│  │ └─────────────────┘ │    │ 持久化存储 (挂载卷)              │   │
│  └─────────────────────┘    │ - 工作空间文件                    │   │
│                              │ - 执行结果快照                    │   │
│  ┌─────────────────────┐    └─────────────────────────────────┘   │
│  │ PostgreSQL + Redis  │                                          │
│  │ 任务/会话/配置存储   │                                          │
│  └─────────────────────┘                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 二、第一层 - 前端 Web 控制台

### 2.1 技术选型

| 类别 | 选择 | 理由 |
|------|------|------|
| 框架 | Next.js 14 (App Router) | SSR + CSR 混合，生态成熟 |
| UI 组件库 | shadcn/ui + Tailwind CSS | 高度可定制，美观现代 |
| 状态管理 | Zustand | 轻量，适合 WebSocket 实时状态 |
| 终端模拟 | xterm.js | 专业终端渲染，支持 ANSI 颜色 |
| 流程图 | React Flow | 展示任务分解和执行流程 |
| Markdown | react-markdown + rehype | 渲染智能体思考内容 |
| 图标 | Lucide React | 与 shadcn/ui 配套 |

### 2.2 页面结构

```
┌────────────────────────────────────────────────────────────────┐
│  顶部导航栏: Logo │ 任务列表 │ 设置 │ 用户                      │
├──────────┬─────────────────────────────────────────────────────┤
│          │                                                     │
│  左侧    │              主工作区                                │
│  任务    │                                                     │
│  列表    │  ┌─────────────────────────────────────────────┐    │
│          │  │  对话输入区: 输入任务描述，发送给智能体        │    │
│  ──────  │  └─────────────────────────────────────────────┘    │
│  任务1   │                                                     │
│  任务2   │  ┌────────────────┬────────────────────────────┐    │
│  任务3   │  │                │                            │    │
│  ...     │  │  思考过程面板   │    执行动作面板             │    │
│          │  │                │                            │    │
│  ──────  │  │  - 任务规划    │    - 终端输出 (xterm)       │    │
│  新建    │  │  - 推理链      │    - 浏览器截图             │    │
│  任务    │  │  - 决策说明    │    - 文件变更 diff          │    │
│          │  │  - 自我反思    │    - 命令执行结果           │    │
│          │  │                │                            │    │
│          │  └────────────────┴────────────────────────────┘    │
│          │                                                     │
│          │  ┌─────────────────────────────────────────────┐    │
│          │  │  底部状态栏: 任务状态 │ 执行步骤 │ Token 消耗  │    │
│          │  └─────────────────────────────────────────────┘    │
├──────────┴─────────────────────────────────────────────────────┤
│  右侧抽屉 (可展开): 文件浏览器 │ 浏览器实时画面 │ 任务详情     │
└────────────────────────────────────────────────────────────────┘
```

### 2.3 核心页面与功能

#### 2.3.1 任务对话页 (主页面)

- **任务输入**: 类聊天界面，用户用自然语言描述任务
- **思考过程面板**: 实时展示智能体的规划、推理、决策过程（Markdown 渲染）
- **执行动作面板**: 分 Tab 展示终端输出、浏览器截图、文件变更
- **步骤时间线**: 左侧纵向时间线，展示每一步的状态（进行中/完成/失败）

#### 2.3.2 任务管理页

- 任务列表（进行中 / 已完成 / 失败）
- 任务搜索与筛选
- 批量操作（重试、取消、删除）
- 任务详情查看（回放历史执行过程）

#### 2.3.3 设置中心

- **AI 模型配置**: 添加/编辑多个 LLM API（提供商、模型名、API Key、Base URL）
- **默认模型选择**: 设置默认使用的模型
- **沙箱配置**: Docker 资源限制（CPU/内存/磁盘）
- **系统设置**: 端口、日志级别、并发任务数

#### 2.3.4 文件浏览器

- 浏览沙箱工作空间中的文件和目录
- 在线预览文件内容（代码高亮）
- 下载文件到本地

### 2.4 实时通信设计

```
前端 ──WebSocket──▶ NestJS
  ├── 订阅: task:{id}:thinking    (思考过程流)
  ├── 订阅: task:{id}:action      (执行动作流)
  ├── 订阅: task:{id}:terminal    (终端输出流)
  ├── 订阅: task:{id}:browser     (浏览器截图流)
  ├── 订阅: task:{id}:status      (任务状态变更)
  └── 发送: task:create / task:cancel / task:retry
```

---

## 三、第二层 - 调度编排层 (NestJS)

### 3.1 技术选型

| 类别 | 选择 | 理由 |
|------|------|------|
| 框架 | NestJS 10 | 企业级 Node.js 框架，模块化架构 |
| 任务队列 | BullMQ + Redis | 高性能任务队列，支持优先级/重试/延迟 |
| WebSocket | Socket.IO | 双向实时通信，自动重连 |
| ORM | TypeORM | 成熟的 TypeScript ORM |
| 数据库 | PostgreSQL | 可靠的关系型数据库 |
| 缓存 | Redis | 会话缓存、队列、发布订阅 |
| 验证 | class-validator | 请求参数校验 |
| API 文档 | Swagger | 自动生成 API 文档 |

### 3.2 模块划分

```
src/
├── modules/
│   ├── task/              # 任务管理模块
│   │   ├── task.controller.ts
│   │   ├── task.service.ts
│   │   ├── task.entity.ts
│   │   └── dto/
│   ├── session/           # 会话管理模块
│   │   ├── session.controller.ts
│   │   ├── session.service.ts
│   │   └── session.entity.ts
│   ├── scheduler/         # 调度引擎模块
│   │   ├── scheduler.service.ts
│   │   ├── brain-client.service.ts    # 调用 Python 大脑
│   │   └── sandbox-client.service.ts  # 调用 Docker 沙箱
│   ├── gateway/           # WebSocket 网关
│   │   ├── task.gateway.ts
│   │   └── events.gateway.ts
│   ├── llm-config/        # LLM 配置管理
│   │   ├── llm-config.controller.ts
│   │   ├── llm-config.service.ts
│   │   └── llm-config.entity.ts
│   ├── sandbox/           # 沙箱管理模块
│   │   ├── sandbox.service.ts
│   │   └── docker.service.ts
│   ├── auth/              # 认证模块
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── strategies/
│   └── file/              # 文件管理模块
│       ├── file.controller.ts
│       └── file.service.ts
├── common/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   └── decorators/
└── config/
    ├── database.config.ts
    └── redis.config.ts
```

### 3.3 核心调度流程

这是整个系统最核心的部分 —— NestJS 作为总指挥，协调大脑和手脚：

```
                    ┌─────────────┐
                    │  用户任务请求  │
                    └──────┬──────┘
                           ▼
                    ┌─────────────┐
                    │  创建任务记录  │  PostgreSQL
                    │  入队等待执行  │  BullMQ
                    └──────┬──────┘
                           ▼
              ┌────────────────────────┐
              │    调度引擎主循环        │
              │  (Scheduler Service)    │
              └────────────┬───────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ Step 1: 规划  │ │ Step 2: 执行  │ │ Step 3: 观察  │
   │              │ │              │ │              │
   │ 调用 Python  │ │ 调用 Docker  │ │ 收集执行结果  │
   │ 大脑做推理   │ │ 沙箱执行动作  │ │ 推送前端展示  │
   │ 返回动作计划  │ │ 返回执行结果  │ │              │
   └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                    ┌─────────────┐
                    │ 任务完成？    │
                    │             │
                    │ 是 → 结束    │
                    │ 否 → 回到    │
                    │      Step 1  │
                    └─────────────┘
```

**详细调度步骤**:

1. **规划阶段**: NestJS 将任务上下文 + 历史步骤 + 执行结果发送给 Python 大脑
2. **大脑推理**: Python LangGraph 进行推理，返回下一步动作（如：执行命令、浏览网页、读取文件）
3. **执行阶段**: NestJS 将动作指令发送给 Docker 沙箱执行
4. **观察阶段**: 收集执行结果，通过 WebSocket 推送给前端
5. **循环判断**: 如果大脑说任务完成，则结束；否则回到步骤 1

### 3.4 任务状态机

```
  PENDING ──▶ QUEUED ──▶ RUNNING ──▶ COMPLETED
                │           │
                │           ▼
                │       FAILED ──▶ RETRYING ──▶ RUNNING
                │           │
                │           ▼
                │       CANCELLED
                │
                └──▶ CANCELLED
```

### 3.5 WebSocket 事件设计

```typescript
// 服务端 → 客户端
interface ServerEvents {
  'task:created': { taskId: string; description: string };
  'task:status': { taskId: string; status: TaskStatus; step?: number };
  'task:thinking': { taskId: string; content: string; timestamp: number };
  'task:action': { taskId: string; action: Action; timestamp: number };
  'task:terminal': { taskId: string; data: string; stream: 'stdout' | 'stderr' };
  'task:browser': { taskId: string; screenshot: string; url: string };
  'task:file_change': { taskId: string; path: string; type: 'create' | 'modify' | 'delete' };
  'task:completed': { taskId: string; summary: string };
  'task:failed': { taskId: string; error: string };
}

// 客户端 → 服务端
interface ClientEvents {
  'task:create': { description: string; model?: string };
  'task:cancel': { taskId: string };
  'task:retry': { taskId: string };
  'task:subscribe': { taskId: string };
  'task:unsubscribe': { taskId: string };
}
```

---

## 四、第三层 - 智能推理层 (Python FastAPI + LangGraph)

### 4.1 技术选型

| 类别 | 选择 | 理由 |
|------|------|------|
| Web 框架 | FastAPI | 高性能异步，自动 API 文档 |
| Agent 框架 | LangGraph | 状态机式 Agent 编排，支持循环/分支/并行 |
| LLM 适配 | LiteLLM | 统一接口调用 100+ 模型，关键组件 |
| 向量数据库 | ChromaDB | 轻量级本地向量库，长期记忆 |
| 数据验证 | Pydantic v2 | FastAPI 原生集成 |
| 日志 | Loguru | 简洁强大的 Python 日志库 |

### 4.2 模块结构

```
brain/
├── app/
│   ├── main.py                    # FastAPI 入口
│   ├── api/
│   │   ├── routes/
│   │   │   ├── agent.py           # Agent 推理接口
│   │   │   ├── models.py          # 模型管理接口
│   │   │   └── health.py          # 健康检查
│   │   └── deps.py
│   ├── core/
│   │   ├── config.py              # 配置管理
│   │   └── llm.py                 # LiteLLM 封装
│   ├── agent/
│   │   ├── graph.py               # LangGraph 主图定义
│   │   ├── nodes/
│   │   │   ├── planner.py         # 规划节点
│   │   │   ├── executor.py        # 执行决策节点
│   │   │   ├── observer.py        # 观察节点
│   │   │   └── reflector.py       # 反思节点
│   │   ├── tools/
│   │   │   ├── registry.py        # 工具注册中心
│   │   │   ├── shell.py           # Shell 命令工具
│   │   │   ├── file_read.py       # 文件读取工具
│   │   │   ├── file_write.py      # 文件写入工具
│   │   │   ├── browser.py         # 浏览器操作工具
│   │   │   ├── code_run.py        # 代码运行工具
│   │   │   └── search.py          # 搜索工具
│   │   └── prompts/
│   │       ├── system.py          # 系统提示词
│   │       ├── planner.py         # 规划提示词
│   │       └── reflector.py       # 反思提示词
│   ├── memory/
│   │   ├── short_term.py          # 短期记忆 (对话上下文)
│   │   ├── long_term.py           # 长期记忆 (向量检索)
│   │   └── working.py             # 工作记忆 (当前任务状态)
│   └── models/
│       ├── schemas.py             # Pydantic 模型
│       └── state.py               # Agent 状态定义
```

### 4.3 LangGraph Agent 图设计

这是智能体的核心 —— 用 LangGraph 状态图定义 Agent 的思考和行动循环：

```
                    ┌──────────┐
                    │  START   │
                    └────┬─────┘
                         ▼
                  ┌──────────────┐
                  │   Planner    │  分析任务，制定计划
                  │   规划节点    │  输出: 步骤列表 + 下一步动作
                  └──────┬───────┘
                         ▼
                  ┌──────────────┐
                  │  Executor    │  决定执行什么工具
                  │  执行决策节点  │  输出: ToolCall
                  └──────┬───────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Shell    │ │ Browser  │ │ File     │
        │ 命令执行  │ │ 浏览器    │ │ 文件操作  │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │
             └────────────┼────────────┘
                          ▼
                   ┌──────────────┐
                   │  Observer    │  观察执行结果
                   │  观察节点     │  提取关键信息
                   └──────┬───────┘
                          ▼
                   ┌──────────────┐
                   │  Reflector   │  反思: 任务完成了吗？
                   │  反思节点     │  需要调整策略吗？
                   └──────┬───────┘
                          │
                ┌─────────┼─────────┐
                ▼                   ▼
          ┌──────────┐        ┌──────────┐
          │ 完成      │        │ 继续循环  │
          │ END      │        │ → Planner│
          └──────────┘        └──────────┘
```

### 4.4 Agent 状态定义

```python
class AgentState(TypedDict):
    task_description: str              # 原始任务描述
    plan: list[Step]                   # 执行计划
    current_step_index: int            # 当前步骤索引
    history: list[ActionObservation]   # 历史动作和观察
    short_term_memory: list[Message]   # 短期记忆 (对话历史)
    working_memory: dict               # 工作记忆 (中间变量)
    iteration_count: int               # 迭代计数 (防死循环)
    max_iterations: int                # 最大迭代次数
    status: Literal["planning", "executing", "observing", "reflecting", "completed", "failed"]
    final_result: str | None           # 最终结果
```

### 4.5 工具系统设计

智能体可调用的工具（注意：这些工具由大脑决策调用，但实际执行由 Docker 沙箱完成）：

| 工具名 | 功能 | 参数 | 返回 |
|--------|------|------|------|
| `shell_execute` | 执行 Shell 命令 | command, timeout, cwd | stdout, stderr, exit_code |
| `file_read` | 读取文件内容 | path, start_line, end_line | content |
| `file_write` | 写入文件 | path, content, mode(overwrite/append) | success |
| `file_list` | 列出目录 | path, pattern | file_list |
| `browser_navigate` | 打开网页 | url | page_title, screenshot |
| `browser_click` | 点击元素 | selector | screenshot |
| `browser_type` | 输入文字 | selector, text | screenshot |
| `browser_screenshot` | 截图 | 无 | screenshot_base64 |
| `browser_extract` | 提取页面内容 | selector | text_content |
| `code_execute` | 运行代码 | language, code, timeout | stdout, stderr |
| `search_web` | 网页搜索 | query | results_list |

### 4.6 LiteLLM 多模型适配

```python
# 统一调用接口，支持所有主流模型
# 用户在 Web 界面配置 API Key 后，NestJS 存入数据库
# 调用大脑时将配置传入

supported_providers = {
    "openai": ["gpt-4o", "gpt-4.1", "gpt-4.1-mini", "o3", "o4-mini"],
    "anthropic": ["claude-sonnet-4-20250514", "claude-3.5-haiku"],
    "azure": ["gpt-4o", "gpt-4.1"],
    "deepseek": ["deepseek-chat", "deepseek-reasoner"],
    "openrouter": ["*"],  # 通过 OpenRouter 访问任意模型
    "ollama": ["*"],       # 本地模型
    "custom": ["*"],       # 自定义 OpenAI 兼容 API
}
```

### 4.7 记忆管理

```
┌─────────────────────────────────────────────────────┐
│                    记忆架构                           │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ 短期记忆 (Short-term)                        │    │
│  │ - 当前对话的完整消息历史                       │    │
│  │ - 存储在 Redis，TTL 24h                      │    │
│  │ - 滑动窗口: 保留最近 50 轮对话                │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ 工作记忆 (Working)                            │    │
│  │ - 当前任务的中间状态和变量                     │    │
│  │ - 已完成的步骤、待执行的步骤                   │    │
│  │ - 关键发现和决策记录                           │    │
│  │ - 存储在 Agent State 中                       │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ 长期记忆 (Long-term)                          │    │
│  │ - ChromaDB 向量数据库                         │    │
│  │ - 存储历史任务的经验和知识                     │    │
│  │ - 相似任务检索，避免重复犯错                   │    │
│  │ - 持久化到磁盘                                │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## 五、第四层 - 沙箱执行层 (Docker)

### 5.1 技术选型

| 类别 | 选择 | 理由 |
|------|------|------|
| 容器运行时 | Docker Engine | 标准容器化方案 |
| 容器编排 | Docker SDK (Python) | 程序化创建/管理容器 |
| 浏览器自动化 | Playwright | 最强浏览器自动化，支持 Chromium |
| 基础镜像 | 自定义 Ubuntu 镜像 | 预装常用开发工具 |
| 文件共享 | Docker Volume | 宿主机与容器文件交换 |

### 5.2 沙箱架构

```
┌──────────────────────────────────────────────────────────┐
│                    Docker Host (宿主机)                    │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Sandbox Manager (NestJS sandbox.service)          │  │
│  │  - 创建/销毁容器                                    │  │
│  │  - 资源限制配置                                     │  │
│  │  - 健康检查                                        │  │
│  └────────────────────┬───────────────────────────────┘  │
│                       │ Docker API                       │
│       ┌───────────────┼───────────────┐                  │
│       ▼               ▼               ▼                  │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐              │
│  │沙箱容器 A│    │沙箱容器 B│    │沙箱容器 C│              │
│  │         │    │         │    │         │              │
│  │ Ubuntu  │    │ Ubuntu  │    │ Ubuntu  │              │
│  │ Python  │    │ Python  │    │ Python  │              │
│  │ Node.js │    │ Node.js │    │ Node.js │              │
│  │ Playwright│  │ Playwright│  │ Playwright│             │
│  │ Git     │    │ Git     │    │ Git     │              │
│  │ vim/nano│    │ vim/nano│    │ vim/nano│              │
│  │         │    │         │    │         │              │
│  │ ┌─────┐ │    │ ┌─────┐ │    │ ┌─────┐ │              │
│  │ │Agent│ │    │ │Agent│ │    │ │Agent│ │              │
│  │ │Runner│ │    │ │Runner│ │    │ │Runner│ │             │
│  │ └─────┘ │    │ └─────┘ │    │ └─────┘ │              │
│  └────┬────┘    └────┬────┘    └────┬────┘              │
│       │              │              │                    │
│  ┌────┴──────────────┴──────────────┴────┐              │
│  │     共享 Volume: /workspace            │              │
│  │     (持久化工作空间文件)                │              │
│  └───────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────┘
```

### 5.3 沙箱容器内部 Agent Runner

每个沙箱容器内运行一个轻量级 Agent Runner（Python 脚本），负责：

- 监听来自 NestJS 的执行指令
- 执行 Shell 命令并流式返回输出
- 执行文件操作
- 运行 Playwright 浏览器自动化
- 运行代码片段
- 心跳上报

```python
# Agent Runner 伪代码
class AgentRunner:
    def __init__(self):
        self.browser = None  # Playwright browser instance

    async def execute_shell(self, command: str, timeout: int) -> ShellResult:
        # 执行命令，流式返回输出
        pass

    async def execute_file_read(self, path: str) -> str:
        pass

    async def execute_file_write(self, path: str, content: str) -> bool:
        pass

    async def execute_browser_action(self, action: BrowserAction) -> BrowserResult:
        # Playwright 操作
        pass

    async def execute_code(self, language: str, code: str) -> CodeResult:
        pass
```

### 5.4 Docker 镜像构建

```dockerfile
# Dockerfile.sandbox
FROM ubuntu:22.04

# 基础工具
RUN apt-get update && apt-get install -y \
    curl wget git vim nano \
    python3 python3-pip \
    nodejs npm \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Playwright 浏览器
RUN npx playwright install --with-deps chromium

# Agent Runner
COPY agent_runner/ /opt/agent_runner/
RUN pip3 install -r /opt/agent_runner/requirements.txt

# 工作空间
RUN mkdir -p /workspace
WORKDIR /workspace

# 入口
CMD ["python3", "/opt/agent_runner/main.py"]
```

### 5.5 资源限制

```json
{
  "cpu_quota": 50000,
  "cpu_period": 100000,
  "mem_limit": "2g",
  "memswap_limit": "2g",
  "pids_limit": 256,
  "network_mode": "bridge",
  "read_only": false,
  "tmpfs": { "/tmp": "size=512m" }
}
```

### 5.6 安全策略

- 容器内禁止 `sudo` 操作
- 网络出站可配置白名单
- 文件系统通过 Volume 隔离，仅 `/workspace` 可写
- 容器超时自动销毁（默认 30 分钟）
- 禁止容器间通信
- 不挂载 Docker Socket（防止逃逸）

---

## 六、数据流全链路

### 6.1 完整任务执行流程

```
用户: "帮我搜索最新的 Python 3.12 新特性，写一份总结文档"

1. [前端] 用户输入任务 → POST /api/tasks
   │
2. [NestJS] 创建任务记录 (status: PENDING)
   │         推入 BullMQ 队列 (status: QUEUED)
   │         WebSocket 通知前端: task:created
   │
3. [NestJS] 调度引擎取出任务 (status: RUNNING)
   │         创建 Docker 沙箱容器
   │         WebSocket 通知前端: task:status
   │
4. [NestJS → Python] 发送任务上下文到大脑
   │  请求: { task, history: [], tools: [...] }
   │
5. [Python] LangGraph Planner 节点推理
   │  输出思考: "我需要先搜索 Python 3.12 新特性..."
   │  决策: 调用 browser_navigate("https://www.google.com")
   │  返回: { action: "browser_navigate", params: { url: "..." } }
   │
6. [NestJS] WebSocket 推送思考过程: task:thinking
   │         WebSocket 推送执行动作: task:action
   │
7. [NestJS → Docker] 将动作指令发送给沙箱 Agent Runner
   │
8. [Docker] Agent Runner 执行 Playwright 打开浏览器
   │         返回: { screenshot: "base64...", title: "Google" }
   │
9. [NestJS] WebSocket 推送浏览器截图: task:browser
   │
10. [NestJS → Python] 将执行结果发回大脑
    │  请求: { observation: { screenshot, title } }
    │
11. [Python] Observer 节点观察结果
    │  Reflector 节点判断: 任务未完成，继续
    │  Planner 决策: 调用 browser_type 输入搜索词
    │
12. [循环 5-11] 直到任务完成
    │
    ... (搜索 → 提取内容 → 打开多个页面 → 整理信息 → 写文件) ...
    │
13. [Python] Reflector 判断: 任务完成
    │  输出: { status: "completed", result: "已生成总结文档 /workspace/python312_summary.md" }
    │
14. [NestJS] 更新任务状态 (status: COMPLETED)
    │         WebSocket 通知前端: task:completed
    │         销毁 Docker 容器
    │
15. [前端] 展示完成结果，用户可下载文件
```

### 6.2 NestJS ↔ Python 通信协议

```typescript
// NestJS → Python: 请求推理
interface BrainRequest {
  task_id: string;
  session_id: string;
  task_description: string;
  history: ActionObservation[];     // 历史动作和观察
  available_tools: ToolDef[];       // 可用工具列表
  llm_config: LLMConfig;           // 模型配置 (从数据库读取)
  iteration: number;                // 当前迭代次数
}

// Python → NestJS: 返回决策
interface BrainResponse {
  task_id: string;
  thinking: string;                 // 思考过程 (Markdown)
  action: ToolCall | null;          // 下一步动作 (null 表示完成)
  result: string | null;            // 最终结果 (任务完成时)
  status: "thinking" | "acting" | "completed" | "failed";
  token_usage: { input: number; output: number };
}
```

### 6.3 NestJS ↔ Docker 通信协议

```typescript
// NestJS → Docker: 执行指令
interface SandboxRequest {
  task_id: string;
  action: "shell" | "file_read" | "file_write" | "browser" | "code";
  params: Record<string, any>;
  timeout: number;
}

// Docker → NestJS: 执行结果
interface SandboxResponse {
  task_id: string;
  success: boolean;
  result: any;                      // 根据动作类型不同
  stdout?: string;
  stderr?: string;
  exit_code?: number;
  screenshot?: string;              // 浏览器截图 base64
  files_changed?: string[];         // 变更的文件列表
}
```

---

## 七、数据库设计

### 7.1 核心表结构

```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- LLM 配置表
CREATE TABLE llm_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    provider VARCHAR(50) NOT NULL,       -- openai, anthropic, deepseek, etc.
    model_name VARCHAR(100) NOT NULL,    -- gpt-4o, claude-sonnet-4-20250514, etc.
    api_key_encrypted TEXT NOT NULL,      -- AES 加密存储
    base_url VARCHAR(255),               -- 自定义 API 地址
    is_default BOOLEAN DEFAULT FALSE,
    config JSONB,                        -- 额外配置 (temperature, max_tokens 等)
    created_at TIMESTAMP DEFAULT NOW()
);

-- 任务表
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id UUID,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, queued, running, completed, failed, cancelled
    llm_config_id UUID REFERENCES llm_configs(id),
    result TEXT,
    error TEXT,
    token_input_count INTEGER DEFAULT 0,
    token_output_count INTEGER DEFAULT 0,
    iteration_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- 任务步骤表
CREATE TABLE task_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id),
    step_number INTEGER NOT NULL,
    thinking TEXT,                        -- 思考过程
    action_type VARCHAR(50),              -- shell, browser, file, code
    action_params JSONB,                  -- 动作参数
    observation TEXT,                     -- 执行结果
    status VARCHAR(20),                   -- pending, running, completed, failed
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 会话表
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 沙箱实例表
CREATE TABLE sandbox_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id),
    container_id VARCHAR(100),
    status VARCHAR(20),                   -- creating, running, stopped, destroyed
    workspace_path VARCHAR(255),
    resource_limits JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    destroyed_at TIMESTAMP
);
```

---

## 八、开源组件推荐与可复用项目

### 8.1 可直接复用的核心开源项目

#### ⭐ OpenHands (原 OpenDevin) — 最重要参考项目
- GitHub: https://github.com/All-Hands-AI/OpenHands
- **为什么重要**: 这是目前最接近 Manus 的开源项目，架构非常相似
- **可复用部分**:
  - Docker 沙箱管理方案 (可直接参考其 sandbox 实现)
  - Agent 与沙箱通信协议
  - Playwright 浏览器自动化集成
  - 前端终端和浏览器实时查看组件
- **不建议直接用**: 它的前端和后端耦合较紧，且不支持多模型灵活切换
- **建议**: 重点研究其沙箱和浏览器自动化部分，移植到我们的架构

#### ⭐ LiteLLM — 必用组件
- GitHub: https://github.com/BerriAI/litellm
- **为什么重要**: 统一 100+ LLM 的调用接口，是我们多模型支持的核心
- **使用方式**: 直接 pip install litellm，作为 Python 大脑的 LLM 调用层
- **关键能力**:
  - 统一 OpenAI/Anthropic/DeepSeek/Ollama 等接口
  - 自动重试和 fallback
  - Token 计费追踪
  - 流式输出支持

#### ⭐ LangGraph — 必用组件
- GitHub: https://github.com/langchain-ai/langgraph
- **为什么重要**: Agent 状态机编排框架，是大脑的核心引擎
- **使用方式**: 直接 pip install langgraph，定义 Agent 推理图
- **关键能力**:
  - 状态图定义，支持循环/分支/并行
  - 内置 ReAct 模式
  - 人类干预点 (human-in-the-loop)
  - 持久化检查点

#### ⭐ Playwright — 必用组件
- GitHub: https://github.com/microsoft/playwright
- **为什么重要**: 最强大的浏览器自动化工具，沙箱内的浏览器操作核心
- **使用方式**: 在 Docker 镜像中预装，Agent Runner 调用
- **关键能力**:
  - Chromium/Firefox/WebKit 支持
  - 无头模式，适合服务器环境
  - 截图、PDF 生成
  - 网络拦截和修改

### 8.2 值得参考的项目

| 项目 | GitHub | 参考价值 |
|------|--------|----------|
| SWE-agent | https://github.com/princeton-nlp/SWE-agent | Agent 工具设计和提示词工程 |
| AutoGPT | https://github.com/Significant-Gravitas/AutoGPT | 任务分解和自主规划思路 |
| AgentGPT | https://github.com/reworkd/AgentGPT | Web 前端 + Agent 交互 UI |
| Open Interpreter | https://github.com/OpenInterpreter/open-interpreter | 代码解释器和本地执行 |
| E2B | https://github.com/e2b-dev/e2b | 安全沙箱方案参考 (可替代自建 Docker) |
| Dify | https://github.com/langgenius/dify | 前端 UI 和工作流编排参考 |
| Flowise | https://github.com/FlowiseAI/Flowise | 可视化 Agent 编排 UI |

### 8.3 前端可直接用的组件/库

| 组件 | 来源 | 用途 |
|------|------|------|
| shadcn/ui | https://ui.shadcn.com | 基础 UI 组件 |
| xterm.js | https://xtermjs.org | 终端模拟器 |
| React Flow | https://reactflow.dev | 任务流程可视化 |
| react-markdown | https://github.com/remarkjs/react-markdown | Markdown 渲染 |
| Socket.IO Client | https://socket.io | WebSocket 通信 |
| @monaco-editor/react | https://github.com/suren-atoyan/monaco-react | 代码编辑器 (VS Code 内核) |
| react-diff-viewer | https://github.com/praneshravi/react-diff-viewer | 文件 diff 展示 |

### 8.4 后端可直接用的库

| 库 | 来源 | 用途 |
|------|------|------|
| BullMQ | https://github.com/taskforcesh/bullmq | 任务队列 |
| TypeORM | https://github.com/typeorm/typeorm | 数据库 ORM |
| class-validator | https://github.com/typestack/class-validator | 参数校验 |
| Docker SDK (Python) | https://github.com/docker/docker-py | 容器管理 |
| ChromaDB | https://github.com/chroma-core/chroma | 向量数据库 (长期记忆) |
| Loguru | https://github.com/Delgan/loguru | Python 日志 |

---

## 九、部署架构

### 9.1 服务器部署方案

```
┌─────────────────────────────────────────────────────────────┐
│                    Linux 服务器                               │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Nginx (反向代理 + SSL)                                │  │
│  │  - 前端静态文件服务                                     │  │
│  │  - /api/* → NestJS                                    │  │
│  │  - /ws/* → NestJS WebSocket                           │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────┼───────────────────────────────┐  │
│  │  Docker Compose 编排                                   │  │
│  │                                                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │  │
│  │  │ Next.js  │ │ NestJS   │ │ FastAPI  │ │PostgreSQL│ │  │
│  │  │ 前端     │ │ 调度层   │ │ 大脑层   │ │ 数据库   │ │  │
│  │  │ :3000    │ │ :4000    │ │ :5000    │ │ :5432    │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │  │
│  │                                                       │  │
│  │  ┌──────────┐ ┌──────────────────────────────────────┐│  │
│  │  │ Redis    │ │ Docker-in-Docker (沙箱容器管理)       ││  │
│  │  │ :6379    │ │ - 动态创建/销毁沙箱容器               ││  │
│  │  └──────────┘ └──────────────────────────────────────┘│  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 docker-compose.yml 结构

```yaml
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: ["./nginx.conf:/etc/nginx/nginx.conf"]

  frontend:
    build: ./frontend
    environment:
      - NEXT_PUBLIC_API_URL=/api
      - NEXT_PUBLIC_WS_URL=/ws

  scheduler:
    build: ./scheduler
    depends_on: [postgres, redis]
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
      - BRAIN_URL=http://brain:5000
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - workspace:/workspace

  brain:
    build: ./brain
    depends_on: [redis]
    environment:
      - REDIS_URL=redis://redis:6379

  postgres:
    image: postgres:16-alpine
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    volumes: ["redisdata:/data"]

volumes:
  pgdata:
  redisdata:
  workspace:
```

### 9.3 GitHub 部署流程

```
本地开发 → git push → GitHub 仓库
                        │
                        ▼ (服务器上)
                  git clone/pull
                        │
                        ▼
                  docker compose build
                        │
                        ▼
                  docker compose up -d
```

建议在服务器上创建一个简单的部署脚本：

```bash
#!/bin/bash
# deploy.sh
cd /opt/agentx
git pull origin main
docker compose build --parallel
docker compose up -d --remove-orphans
docker compose ps  # 检查状态
```

---

## 十、开发阶段与周期估算

### Phase 1: 基础骨架 (2 周)

**目标**: 跑通四层通信链路

| 任务 | 说明 | 预计时间 |
|------|------|----------|
| 项目初始化 | Monorepo 结构，Docker Compose 基础配置 | 1 天 |
| NestJS 骨架 | 模块结构、数据库连接、基础 CRUD | 2 天 |
| FastAPI 骨架 | API 路由、LiteLLM 集成、基础 Agent | 2 天 |
| Docker 沙箱基础 | 沙箱镜像构建、Agent Runner 基础版 | 2 天 |
| 前端骨架 | Next.js 项目、基础布局、路由 | 2 天 |
| 通信联调 | NestJS ↔ FastAPI ↔ Docker 通信跑通 | 3 天 |

**里程碑**: 能在前端输入任务，经过四层传递，在沙箱执行一条 Shell 命令并返回结果

### Phase 2: 智能体核心 (3 周)

**目标**: Agent 能自主完成简单任务

| 任务 | 说明 | 预计时间 |
|------|------|----------|
| LangGraph Agent 图 | Planner/Executor/Observer/Reflector 四节点 | 3 天 |
| 工具系统 | Shell、文件读写工具实现 | 2 天 |
| 记忆管理 | 短期记忆 + 工作记忆 | 2 天 |
| 提示词工程 | 系统提示词、规划提示词、反思提示词 | 3 天 |
| 多模型适配 | LiteLLM 集成，前端 API Key 配置 | 2 天 |
| 任务队列 | BullMQ 集成，并发控制 | 2 天 |
| 循环调度 | NestJS 调度引擎主循环 | 3 天 |

**里程碑**: Agent 能自主完成"创建一个文件并写入内容"这类简单任务

### Phase 3: 浏览器自动化 (2 周)

**目标**: Agent 能浏览网页、搜索信息

| 任务 | 说明 | 预计时间 |
|------|------|----------|
| Playwright 集成 | 沙箱内浏览器自动化 | 2 天 |
| 浏览器工具 | navigate/click/type/screenshot/extract | 3 天 |
| 截图流推送 | 实时浏览器画面推送到前端 | 2 天 |
| 网页搜索工具 | 搜索引擎集成 | 1 天 |
| 浏览器提示词 | 网页交互专用提示词 | 2 天 |

**里程碑**: Agent 能自主完成"搜索某个话题并总结"这类任务

### Phase 4: 前端完善 (2 周)

**目标**: 完整的 Web 控制台体验

| 任务 | 说明 | 预计时间 |
|------|------|----------|
| 实时日志 | WebSocket 日志流、xterm 终端 | 2 天 |
| 思考可视化 | Markdown 渲染思考过程 | 1 天 |
| 任务管理 | 任务列表、状态、重试 | 2 天 |
| 设置中心 | API Key 配置、模型选择 | 2 天 |
| 文件浏览器 | 沙箱文件浏览和下载 | 2 天 |
| 浏览器画面 | 实时浏览器截图展示 | 1 天 |
| UI 美化 | 整体 UI 打磨 | 2 天 |

**里程碑**: 完整可用的 Web 控制台

### Phase 5: 高级功能 (2 周)

**目标**: 接近 Manus 的完整体验

| 任务 | 说明 | 预计时间 |
|------|------|----------|
| 长期记忆 | ChromaDB 向量检索 | 2 天 |
| 代码执行 | Python/Node.js 代码运行 | 2 天 |
| 错误恢复 | 智能重试、策略调整 | 2 天 |
| 并发任务 | 多任务并行执行 | 2 天 |
| 部署脚本 | 一键部署、环境初始化 | 1 天 |
| 测试与优化 | 端到端测试、性能优化 | 3 天 |

**里程碑**: 系统可正式使用

### 总计开发周期: 约 11 周 (2.5 个月)

> 注: 以上为 AI 辅助开发估算。纯人工开发周期约 2-3 倍。

---

## 十一、项目目录结构总览

```
agentx/
├── frontend/                    # 前端 Next.js 项目
│   ├── src/
│   │   ├── app/                 # App Router 页面
│   │   │   ├── page.tsx         # 首页/任务对话
│   │   │   ├── tasks/           # 任务管理页
│   │   │   └── settings/        # 设置页
│   │   ├── components/          # 组件
│   │   │   ├── chat/            # 对话组件
│   │   │   ├── terminal/        # 终端组件
│   │   │   ├── browser/         # 浏览器预览组件
│   │   │   ├── thinking/        # 思考过程组件
│   │   │   └── file-browser/    # 文件浏览器组件
│   │   ├── hooks/               # 自定义 Hooks
│   │   ├── stores/              # Zustand 状态
│   │   ├── lib/                 # 工具函数
│   │   └── types/               # TypeScript 类型
│   ├── package.json
│   └── Dockerfile
│
├── scheduler/                   # NestJS 调度层
│   ├── src/
│   │   ├── modules/
│   │   │   ├── task/
│   │   │   ├── session/
│   │   │   ├── scheduler/
│   │   │   ├── gateway/
│   │   │   ├── llm-config/
│   │   │   ├── sandbox/
│   │   │   ├── auth/
│   │   │   └── file/
│   │   ├── common/
│   │   └── config/
│   ├── package.json
│   └── Dockerfile
│
├── brain/                       # Python 智能体大脑
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── agent/
│   │   │   ├── graph.py
│   │   │   ├── nodes/
│   │   │   ├── tools/
│   │   │   └── prompts/
│   │   ├── memory/
│   │   └── models/
│   ├── requirements.txt
│   └── Dockerfile
│
├── sandbox/                     # Docker 沙箱
│   ├── agent_runner/
│   │   ├── main.py
│   │   ├── shell_executor.py
│   │   ├── file_executor.py
│   │   ├── browser_executor.py
│   │   └── code_executor.py
│   ├── Dockerfile.sandbox
│   └── requirements.txt
│
├── deploy/                      # 部署相关
│   ├── docker-compose.yml
│   ├── nginx.conf
│   ├── deploy.sh
│   └── .env.example
│
├── docs/                        # 文档
└── README.md
```

---

## 十二、关键技术决策总结

| 决策点 | 选择 | 理由 |
|--------|------|------|
| Agent 框架 | LangGraph 而非纯 LangChain | 状态图更适合复杂 Agent 编排，支持循环和条件分支 |
| LLM 适配 | LiteLLM 而非自建 | 成熟方案，支持 100+ 模型，省去大量适配工作 |
| 沙箱方案 | 自建 Docker 而非 E2B | E2B 是 SaaS 服务，自建更可控且免费 |
| 前端框架 | Next.js 而非 Vue | SSR 支持更好，React 生态更丰富 |
| 调度层 | NestJS 而非 Express | 模块化架构，TypeScript 原生支持，适合中大型项目 |
| 任务队列 | BullMQ 而非 RabbitMQ | 轻量级，Redis 驱动，适合此规模 |
| 浏览器自动化 | Playwright 而非 Selenium | 更快、更稳定、API 更现代 |
| 向量数据库 | ChromaDB 而非 Pinecone | 本地部署，无需外部服务 |
| 实时通信 | Socket.IO 而非原生 WS | 自动重连、房间机制、更可靠 |

---

## 十三、风险与应对

| 风险 | 影响 | 应对策略 |
|------|------|----------|
| LLM 幻觉导致执行危险命令 | 沙箱损坏或数据丢失 | 沙箱隔离 + 命令白名单 + 人工确认机制 |
| Agent 陷入死循环 | Token 消耗过大 | 最大迭代次数限制 + 超时自动终止 |
| Docker 容器资源耗尽 | 服务器崩溃 | 资源限制 + 并发控制 + 容器自动回收 |
| 多模型 API 不稳定 | 任务执行失败 | LiteLLM 自动 fallback + 重试机制 |
| 浏览器自动化被反爬 | 网页操作失败 | Playwright stealth 插件 + 代理池 |

---

> 本文档为 AgentX 智能体系统的完整设计蓝图，后续开发以此为基准。
