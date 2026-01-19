Ordinary AI is a beast trapped in a box. Limited permissions confine it to a dialog box, lying on a hospital bed like a vegetable, moaning. The MCP protocol is like AI's "blood vessels" and "neurons"—a signal transmission that enables AI instructions.

Here I use vscode with the `cline` client, paired with `Google gemini` as the underlying large model "kernel".
I'll skip the configuration process.

## cline UI Interaction

After configuring `Google gemini` and integrating the `file-system` mcp.

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

After enabling, you'll find that the mcp-server-filesystem process is started locally with npx.

`ps aux | grep "npx.*server-filesystem"`

- Directly declare "delete all screenshots on my desktop" in the cline dialog
![image](/img/in-post/mcp-example/1.png)

- Click Approve to agree to let Cline browse directory files.

![image](/img/in-post/mcp-example/2.png)



![image](/img/in-post/mcp-example/3.png)

- Click run command to execute the command, then you can see vs code input and execute the corresponding command in the terminal.

This uses function call combined with mcp server to produce results.

## Three-way Interaction Between Client, Google Gemini, and MCP Server

### 1. MCP Server Analysis
- **Source**: [`github.com/modelcontextprotocol/servers/tree/main/src/filesystem`](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
- **Function**: Provides file system operation tools, including:
  - `list_files`: List files in the specified directory.
  - `read_file`: Read file content.
  - `write_file`: Write file content.
  - `delete_file`: Delete the specified file.
- **Protocol**: Uses JSON-RPC, provides services through HTTP or STDIO, supports tool discovery (`ListTools` request) and tool invocation.
- **Key Point**: No direct `delete_screenshots` tool, but can get file list through `list_files`, combined with multiple `delete_file` calls to delete `.png` and `.jpg` files.

### 2. Adjusted Assumptions
- User prompt "delete all screenshots on desktop" is parsed by Gemini as:
  1. Call `list_files` to get desktop file list.
  2. Filter `.png` and `.jpg` files, call `delete_file` one by one.
- MCP Server runs locally, listening on `http://localhost:8080`.
- Desktop path example: `/home/user/Desktop`.

### 3. Process
1. User sends prompt through Gemini API.
2. Gemini generates `list_files` call to get desktop file list.
3. MCP client filters screenshot files and initiates multiple `delete_file` calls.
4. MCP Server executes delete operations and returns results.
5. Gemini summarizes results and generates final response.

---

## Complete Web Request Example

The following is a web request flow based on Gemini API and the specified MCP Server.

### 1. User Sends Request to Gemini API

User sends prompt through HTTP POST request to Gemini API.

**Request**:
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

Explanation:

- tools: Defines list_files and delete_file tools, based on the file system MCP Server implementation (refer to src/filesystem functionality).
- path: Assumes desktop path is /home/user/Desktop, actual path provided by MCP client or context.
- Gemini will first call list_files to get file list.

### 2. Gemini API Response (Generates list_files Call)

Gemini parses user prompt and decides to call list_files first to get desktop file list.

Response:

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

Explanation:

- Gemini generates list_files call, specifying desktop path.
- MCP client will handle this call and communicate with MCP Server.

### 3. MCP Client Sends list_files Request to MCP Server

MCP client sends list_files request to file system MCP Server through JSON-RPC.

Request:

```http
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

Explanation:

- URL: MCP Server runs locally at http://localhost:8080/mcp.
- method: Calls list_files, conforming to file system MCP Server tool definition.

### 4. MCP Server Responds to list_files

MCP Server executes list_files and returns desktop file list. Assume desktop contains the following files:

- screenshot1.png
- screenshot2.jpg
- document.txt

Response
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

Explanation:

- The returned files array lists all desktop files.
- MCP client will filter out .png and .jpg files.

### 5. MCP Client Filters Screenshots and Initiates delete_file Requests

MCP client parses list_files results, filters out screenshot files (screenshot1.png and screenshot2.jpg), and sends delete_file requests one by one.

Request 1 (Delete screenshot1.png):

```http
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

```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "message": "文件 /home/user/Desktop/screenshot1.png 已删除"
  },
  "id": "call_002"
}
```

Request 2 (Delete screenshot2.jpg):

```http
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

```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "message": "文件 /home/user/Desktop/screenshot2.jpg 已删除"
  },
  "id": "call_003"
}
```

Explanation:

MCP client calls delete_file sequentially, deleting one screenshot file each time.

MCP Server executes actual delete operation (based on src/filesystem implementation, likely Python's os.remove).

### 6. MCP Client Summarizes Results and Returns to Gemini

MCP client collects all delete_file results, constructs response and sends back to Gemini through a new Gemini API request.
Request:

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

Explanation:
The request contains the entire conversation history: user prompt, list_files call and results, multiple delete_file calls and results.

Gemini will generate final response based on this information.

### 7. Gemini API Generates Final Response

Gemini receives all tool call results and generates a user-friendly response.
Response:

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

Explanation:
Gemini summarizes delete_file results and generates natural language response.

Summary

Using the MCP Server from github.com/modelcontextprotocol/servers/tree/main/src/filesystem, implementing "delete all screenshots on desktop" through Gemini API and MCP protocol requires the following steps:

1. Gemini calls list_files to get desktop file list.
1. MCP client filters .png and .jpg files and calls delete_file one by one.
1. MCP Server executes deletion and returns results.
1. Gemini summarizes results and generates final response.

## Simplified Google Gemini Function Call Working Principle

The official documentation "[How Function Calling Works](https://ai.google.dev/gemini-api/docs/function-calling?hl=zh-cn&example=meeting#use_model_context_protocol_mcp)" is very clear, here I'll just include a diagram:

![image](/img/in-post/mcp-example/function-calling-overview.png)

MCP server summarizes its capabilities as prompts through [Discovering prompts](https://modelcontextprotocol.io/docs/concepts/prompts#discovering-prompts).
Using MCP-timeserver as an example

### 1. MCP Client Queries Tool List (Tool Discovery)

MCP client gets TimeServer tool list through ListToolsRequest.

```http
POST http://localhost:8081/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": "tools_001"
}

Response
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

### 2. User Sends Prompt to Gemini API

User sends prompt through HTTP POST request to Gemini API, requesting current time.

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

tools: Contains TimeServer tool schema, provided by MCP client.

Prompt: "告诉我当前时间" clearly requests time information.

### 3. Gemini Matches Tool (Semantic Matching)

```json
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

### 4. MCP Client Calls TimeServer Tool

```http
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

5. MCP Client Returns Results to Gemini
6. Gemini Generates Final Response


Gemini will match appropriate tools based on prompts and tool descriptions. The MCP client copies and converts this tool information, initiates service calls, then processes this information and returns it to the user.

The cline plugin actually serves multiple roles in this process: AI client, MCP client, and MCP server (launching local MCP server service). Of course, some AI clients, to limit resource consumption and avoid being too bloated, won't take responsibility for launching MCP server microservices, but instead limit to only using remote MCP servers, which is also acceptable.

get_current_time is just a simplified requirement. The actual execution flow may also involve parallel calls, combined calls of multiple functions, which I won't expand on here.

## Summary

From our human perspective, having AI delete desktop files is a very cumbersome process. We need to import multiple contexts as prompts into API calls, progressively letting AI find answers and execute. This is actually a bit like an open-book exam—the teacher says the answers are all in that book, letting students find and write them out themselves.

It looks a bit stupid, can only be said to be a transitional solution under current historical limitations. If we could establish a standard for a universal knowledge base, letting offline AI pre-warm knowledge base data, then future calls would be much more efficient.

## References

[1]
Prompts
https://modelcontextprotocol.io/docs/concepts/prompts#discovering-prompts

[2]
How does OpenAI Function Calling work?
https://www.youtube.com/watch?v=Qor2VZoBib0&ab_channel=LearnDatawithMark
