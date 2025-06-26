---
layout:       post
title:        "以一个例子说明mcp协议的具体应用以及交互原理"
subtitle:     ""
date:         2025-04-12
author:       "Zeusro"
header-img:   "img/ku.webp"
header-mask:  0.3
# 目录
catalog:      true
# 多语言
multilingual: false
published:    true
tags:
    - AI
---

普通AI是一个困在盒子里面的猛兽。权限的受限让它只能囿于一个对话框中，像个植物人一样躺在一个病床上呻吟。而MCP协议，就相当于AI的”血管“和”神经元“，是一种能实现AI指令的信号传导。

## cline UI交互

配置Google gemini，并集成file-system。


```json
"github.com/modelcontextprotocol/servers/tree/main/src/filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/zeusro/Desktop"
      ],
      "disabled": false,
      "autoApprove": [
        "read_file",
        "write_file",
        "read_multiple_files",
        "list_directory",
        "directory_tree",
        "get_file_info",
        "list_allowed_directories"
      ]
    }
```

启用之后，会发现本地以npx启动了mcp-server-filesystem进程。

`ps aux | grep "npx.*server-filesystem"`

- 直接在 cline 对话框声明“删除我桌面上所有截图”
![image](/img/in-post/mcp-example/1.png)

- 点击Approve表示同意让Cline查阅目录文件。

![image](/img/in-post/mcp-example/2.png)



![image](/img/in-post/mcp-example/3.png)

- 点击 run command表示执行命令，接着可以看到vs code在终端输入并执行了相应命令。

这里用的是 function call 联动 mcp server产生的结果。

## 客户端，Google Gemini 与 mcp server 的三方交互

### 1. MCP Server 分析
- **来源**：[`github.com/modelcontextprotocol/servers/tree/main/src/filesystem`](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
- **功能**：提供文件系统操作工具，包括：
  - `list_files`：列出指定目录中的文件。
  - `read_file`：读取文件内容。
  - `write_file`：写入文件内容。
  - `delete_file`：删除指定文件。
- **协议**：使用 JSON-RPC，通过 HTTP 或 STDIO 提供服务，支持工具发现（`ListTools` 请求）和工具调用。
- **关键点**：无直接 `delete_screenshots` 工具，但可通过 `list_files` 获取文件列表，结合多次 `delete_file` 删除 `.png` 和 `.jpg` 文件。

### 2. 调整后的假设
- 用户提示“删除桌面上所有截图”由 Gemini 解析为：
  1. 调用 `list_files` 获取桌面文件列表。
  2. 筛选 `.png` 和 `.jpg` 文件，逐一调用 `delete_file`。
- MCP Server 运行在本地，监听 `http://localhost:8080`。
- 桌面路径示例：`/home/user/Desktop`。

### 3. 流程
1. 用户通过 Gemini API 发送提示。
2. Gemini 生成 `list_files` 调用，获取桌面文件列表。
3. MCP 客户端筛选截图文件，发起多次 `delete_file` 调用。
4. MCP Server 执行删除操作并返回结果。
5. Gemini 汇总结果，生成最终响应。

---

## 完整 Web 请求示例

以下是基于 Gemini API 和指定 MCP Server 的 Web 请求流程。

### 1. 用户向 Gemini API 发送请求

用户通过 HTTP POST 请求向 Gemini API 发送提示。

**请求**：
```http
POST https://us-central1-aiplatform.googleapis.com/v1/projects/your-project-id/locations/us-central1/publishers/google/models/gemini-1.5-flash-002:generateContent
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "删除桌面上所有截图"
        }
      ]
    }
  ],
  "tools": [
    {
      "function_declarations": [
        {
          "name": "list_files",
          "description": "列出指定目录中的文件和子目录。",
          "parameters": {
            "type": "object",
            "properties": {
              "path": {
                "type": "string",
                "description": "要列出文件的目录路径，例如 '/home/user/Desktop'。"
              }
            },
            "required": ["path"]
          }
        },
        {
          "name": "delete_file",
          "description": "删除指定路径的文件。",
          "parameters": {
            "type": "object",
            "properties": {
              "path": {
                "type": "string",
                "description": "要删除的文件的完整路径，例如 '/home/user/Desktop/screenshot.png'。"
              }
            },
            "required": ["path"]
          }
        }
      ]
    }
  ],
  "generation_config": {
    "temperature": 0.4,
    "top_p": 1,
    "top_k": 32,
    "max_output_tokens": 2048
  }
}
```

说明：

- tools：定义了 list_files 和 delete_file 工具，基于文件系统 MCP Server 的实现（参考 src/filesystem 的功能）。
- path：假设桌面路径为 /home/user/Desktop，实际路径由 MCP 客户端或上下文提供。
- Gemini 将首先调用 list_files 获取文件列表。

### 2. Gemini API 响应（生成 list_files 调用）

Gemini 解析用户提示，决定先调用 list_files 获取桌面文件列表。

响应：

```json
{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [
          {
            "function_call": {
              "name": "list_files",
              "args": {
                "path": "/home/user/Desktop"
              }
            }
          }
        ]
      },
      "finish_reason": "STOP"
    }
  ]
}
```

说明：

- Gemini 生成 list_files 调用，指定桌面路径。
- MCP 客户端将处理此调用并与 MCP Server 通信。

### 3. MCP 客户端向 MCP Server 发送 list_files 请求

MCP 客户端通过 JSON-RPC 向文件系统 MCP Server 发送 list_files 请求。

请求：

```
POST http://localhost:8080/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "list_files",
  "params": {
    "path": "/home/user/Desktop"
  },
  "id": "call_001"
}
```

说明：

- URL：MCP Server 运行在本地 http://localhost:8080/mcp。
- method：调用 list_files，符合文件系统 MCP Server 的工具定义。

### 4. MCP Server 响应 list_files

MCP Server 执行 list_files，返回桌面文件列表。假设桌面包含以下文件：

- screenshot1.png
- screenshot2.jpg
- document.txt

响应
```json
{
  "jsonrpc": "2.0",
  "result": {
    "files": [
      {"path": "/home/user/Desktop/screenshot1.png", "type": "file"},
      {"path": "/home/user/Desktop/screenshot2.jpg", "type": "file"},
      {"path": "/home/user/Desktop/document.txt", "type": "file"}
    ]
  },
  "id": "call_001"
}
```

说明：

- 返回的 files 数组列出桌面所有文件。
- MCP 客户端将筛选出 .png 和 .jpg 文件。

### 5. MCP 客户端筛选截图并发起 delete_file 请求

MCP 客户端解析 list_files 结果，筛选出截图文件（screenshot1.png 和 screenshot2.jpg），并逐一发送 delete_file 请求。

请求 1（删除 screenshot1.png）：

```
POST http://localhost:8080/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "delete_file",
  "params": {
    "path": "/home/user/Desktop/screenshot1.png"
  },
  "id": "call_002"
}
```

```
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "message": "文件 /home/user/Desktop/screenshot1.png 已删除"
  },
  "id": "call_002"
}
```

请求 2（删除 screenshot2.jpg）：

```
POST http://localhost:8080/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "delete_file",
  "params": {
    "path": "/home/user/Desktop/screenshot2.jpg"
  },
  "id": "call_003"
}


```

```
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "message": "文件 /home/user/Desktop/screenshot2.jpg 已删除"
  },
  "id": "call_003"
}
```

说明：

MCP 客户端依次调用 delete_file，每次删除一个截图文件。

MCP Server 执行实际删除操作（基于 src/filesystem 的实现，可能是 Python 的 os.remove）。

### 6. MCP 客户端汇总结果并返回给 Gemini
MCP 客户端收集所有 delete_file 的结果，构造响应并通过新的 Gemini API 请求发送回 Gemini。
请求：

```
http

POST https://us-central1-aiplatform.googleapis.com/v1/projects/your-project-id/locations/us-central1/publishers/google/models/gemini-1.5-flash-002:generateContent
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "删除桌面上所有截图"
        }
      ]
    },
    {
      "role": "model",
      "parts": [
        {
          "function_call": {
            "name": "list_files",
            "args": {
              "path": "/home/user/Desktop"
            }
          }
        }
      ]
    },
    {
      "role": "function",
      "parts": [
        {
          "function_response": {
            "name": "list_files",
            "response": {
              "files": [
                {"path": "/home/user/Desktop/screenshot1.png", "type": "file"},
                {"path": "/home/user/Desktop/screenshot2.jpg", "type": "file"},
                {"path": "/home/user/Desktop/document.txt", "type": "file"}
              ]
            }
          }
        }
      ]
    },
    {
      "role": "model",
      "parts": [
        {
          "function_call": {
            "name": "delete_file",
            "args": {
              "path": "/home/user/Desktop/screenshot1.png"
            }
          }
        },
        {
          "function_call": {
            "name": "delete_file",
            "args": {
              "path": "/home/user/Desktop/screenshot2.jpg"
            }
          }
        }
      ]
    },
    {
      "role": "function",
      "parts": [
        {
          "function_response": {
            "name": "delete_file",
            "response": {
              "success": true,
              "message": "文件 /home/user/Desktop/screenshot1.png 已删除"
            }
          }
        },
        {
          "function_response": {
            "name": "delete_file",
            "response": {
              "success": true,
              "message": "文件 /home/user/Desktop/screenshot2.jpg 已删除"
            }
          }
        }
      ]
    }
  ]
}
```

说明：
请求包含整个对话历史：用户提示、list_files 调用和结果、多次 delete_file 调用和结果。

Gemini 将根据这些信息生成最终响应。

### 7. Gemini API 生成最终响应
Gemini 接收所有工具调用的结果，生成用户友好的响应。
响应：

```json


{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [
          {
            "text": "已成功删除桌面上 2 个截图文件：screenshot1.png 和 screenshot2.jpg。"
          }
        ]
      },
      "finish_reason": "STOP"
    }
  ]
}
```

说明：
Gemini 总结 delete_file 的结果，生成自然语言响应。

总结

使用 github.com/modelcontextprotocol/servers/tree/main/src/filesystem 的 MCP Server，通过 Gemini API 和 MCP 协议实现“删除桌面上所有截图”需要以下步骤：

1. Gemini 调用 list_files 获取桌面文件列表。
1. MCP 客户端筛选 .png 和 .jpg 文件，逐一调用 delete_file。
1. MCP Server 执行删除并返回结果。
1. Gemini 汇总结果生成最终响应。

## 简化的 Google gemini function call 工作原理

官方文档《
[函数调用的工作原理](https://ai.google.dev/gemini-api/docs/function-calling?hl=zh-cn&example=meeting#use_model_context_protocol_mcp)
》说的很清楚，这里只挂一个图：

![image](/img/in-post/mcp-example/function-calling-overview.png)

mcp server 通过
[Discovering prompts](https://modelcontextprotocol.io/docs/concepts/prompts#discovering-prompts)
将自身的能力归纳为一种提示（prompts）。
以 MCP-timeserver举例

### 1. MCP 客户端查询工具列表（工具发现）

MCP 客户端通过 ListToolsRequest 获取 TimeServer 的工具列表。

```
POST http://localhost:8081/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": "tools_001"
}

响应
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "get_current_time",
        "description": "获取当前系统时间，返回 ISO 8601 格式的字符串。",
        "parameters": {
          "type": "object",
          "properties": {},
          "required": []
        }
      },
      {
        "name": "convert_timezone",
        "description": "将时间转换为指定时区。",
        "parameters": {
          "type": "object",
          "properties": {
            "time": { "type": "string", "description": "ISO 8601 时间字符串" },
            "timezone": { "type": "string", "description": "目标时区，如 'America/New_York'" }
          },
          "required": ["time", "timezone"]
        }
      }
    ]
  },
  "id": "tools_001"
}
```

### 2. 用户向 Gemini API 发送提示

用户通过 HTTP POST 请求向 Gemini API 发送提示，要求获取当前时间。

```json
POST https://us-central1-aiplatform.googleapis.com/v1/projects/your-project-id/locations/us-central1/publishers/google/models/gemini-1.5-flash-002:generateContent
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "告诉我当前时间"
        }
      ]
    }
  ],
  "tools": [
    {
      "function_declarations": [
        {
          "name": "get_current_time",
          "description": "获取当前系统时间，返回 ISO 8601 格式的字符串。",
          "parameters": {
            "type": "object",
            "properties": {},
            "required": []
          }
        },
        {
          "name": "convert_timezone",
          "description": "将时间转换为指定时区。",
          "parameters": {
            "type": "object",
            "properties": {
              "time": { "type": "string" },
              "timezone": { "type": "string" }
            },
            "required": ["time", "timezone"]
          }
        }
      ]
    }
  ],
  "generation_config": {
    "temperature": 0.4,
    "top_p": 1,
    "top_k": 32,
    "max_output_tokens": 2048
  }
}
```

tools：包含 TimeServer 的工具 schema，由 MCP 客户端提供。

提示：“告诉我当前时间”明确要求时间信息。

### 3. Gemini 匹配工具（语义匹配）

```
{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [
          {
            "function_call": {
              "name": "get_current_time",
              "args": {}
            }
          }
        ]
      },
      "finish_reason": "STOP"
    }
  ]
}
```

### 4. MCP 客户端调用 TimeServer 工具

```
POST http://localhost:8081/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get_current_time",
    "arguments": {}
  },
  "id": "call_001"
}
``` 

5. MCP 客户端将结果返回 Gemini
6. Gemini 生成最终响应


Gemini 将根据提示和工具描述进行匹配到合适的工具，mcp 客户端复制转换这些工具信息，发起服务调用，后面在处理一下这些信息，返回给用户。

cline 插件在这个过程中实际充当了ai 客户端，mcp 客户端，mcp服务端（拉起本地mcp server服务）多种职责。当然，有些AI客户端为了限制资源占用过于臃肿的问题，不会负责拉起mcp server 微服务的职责，而是限制只使用远程的mcp server，这也是可以的。

get_current_time 只是简化的一种需求，实际的执行流程，可能还涉及并行调用，组合调用多种函数的场景，这里就不展开了。

## 总结

以我们人类看来，让AI删除桌面文件，这个流程非常繁琐，我们需要把多个上下文作为提示词导入到API调用之中，从而渐进地让AI找到答案，并执行。这其实就有点像开卷考试——老师说答案都在那本书里面，让考生自己找并写出来。

看起来有点蠢，只能说是在当前历史局限性下的一种过渡方案。如果能制定一种通用知识库的标准，让离线的AI先行预热知识库数据，那么往后的调用会高效地多。


## 参考链接
https://modelcontextprotocol.io/docs/concepts/prompts#discovering-prompts
https://www.youtube.com/watch?v=Qor2VZoBib0&ab_channel=LearnDatawithMark