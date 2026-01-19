[5 years ago](https://www.bullshitprogram.com/the-seed-of-robot/), I compared AI to an intelligent API gateway, proposing a divide-and-conquer approach to convert a large problem into several solvable small problems.

```go
func sum(arr []int) int {
    if len(arr) == 1 {
        return arr[0]
    }
    mid := len(arr) / 2
    leftSum := sum(arr[:mid])
    rightSum := sum(arr[mid:])
    return leftSum + rightSum
}
```

Just like the recursive summation function above—divide the array in half and recursively sum each part.

Today, this idea is being continued in the [MCP](https://modelcontextprotocol.io/introduction) protocol.

During the 2025-04 period, I used `cline` with `Google gemini` as the underlying large model "kernel" to study the complete protocol of large language models calling MCP.

But currently, MCP's implementation is still somewhat ugly and has some problems.
And due to the problems of large models themselves, it leads to excessive token consumption.

## Current State

The MCP protocol has a built-in service discovery system. Each MCP server registers its implementation and calling methods, then adds them to prompts when calling, as parameters to request remote AI servers, allowing AI to find the correct commands and then execute them locally.

For example, [Gemini Function Call](https://ai.google.dev/gemini-api/docs/function-calling?hl=zh-cn) looks roughly like this:

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tools": [
      {
        "function_declarations": [
          {
            "name": "get_current_weather",
            "description": "Get the current weather for a given location",
            "parameters": {
              "type": "object",
              "properties": {
                "location": {
                  "type": "string",
                  "description": "The city and country, e.g. Shanghai, China"
                }
              },
              "required": ["location"]
            }
          }
        ]
      }
    ],
    "contents": [
      {
        "parts": [
          {
            "text": "What is the weather in Shanghai right now?"
          }
        ]
      }
    ]
  }'
```

The entire process can be very complex. For example, when we order AI to "delete all screenshots on the desktop", the ideal command is:

```bash
find /Users/zeusro/Desktop -type f -name "Screenshot*.png" -delete && find /Users/zeusro/Desktop -type f -name "Screenshot*.jpg" -delete
```

But the actual execution process might be:

1. Find all files on this path, get corresponding paths
1. Delete screenshot image 1
1. Delete screenshot image 2
1. Delete screenshot image n

![image](/img/in-post/mcp-limitation//传统ai问路.png)

This calculation process depends on the large model's own capabilities. If it's something like gemini-2.0, it's the first case, directly one step. Other domestic models basically don't offer free APIs, so I basically don't use them.

```bash
input --> process --> output --> (evaluate) influence, consider whether to execute the next calculation
```

Humans, as external observers, evaluate, observe the impact of calculations, supplement prompts, induce AI to continue calculating, constantly correcting until obtaining the final result.

```zeusro
func 计算(){
    ai.找到合适的工具链调用()
    （可选）用户.评估潜在影响并决定是否要执行相应命令
    ai+mcp client(通常可以在ai客户端里面顺便集成mcp功能，比如vs code cline插件).调用mcp server()
    （可选）用户.评估最终影响()
        if 满足需求（）{
            return
            }
        else{
            用户.补充提示词，继续向ai提问()
            计算()
        }
}
```

From the perspective of code project management, the relationship between AI and humans is like "developer" and "reviewer", with reviewers deciding whether to "merge" the code.

## local function and cloud function

In 2020, I used ride-hailing as an example to propose `Cloud Function`.

`Cloud Function` refers to a function that relies on cloud software and hardware resources to complete auxiliary calculations.

Corresponding to `Cloud Function` is `Local Function`.

`Local Function` refers to an offline computing function.
In the narrow sense, `Local Function` can be performed without a network, generally understood as operating system APIs; in the broad sense, `Local Function` refers to local hardware's local functions.
Like getting Beijing time on a mobile phone—although the phone has a built-in clock, the time needs to be periodically synchronized from the National Time Service Center.

This is a bit like the alarm clock at home—although it can run with batteries, due to time drift, we also need to manually calibrate the time regularly.

## Separation of `local function call` and `cloud function call`

![image](/img/in-post/mcp-limitation/远程本地函数分离.png)

But in my opinion, MCP protocol's current implementation can only be considered a second choice (transitional solution).
Actually, I think what's more needed at this stage is "function separation", dividing functions into `local function call` and `cloud function call`. For `local function call`,
it can even be performed without a network, like "open xx app", "send a text to grandma", such needs don't need cloud functions at all, "offline computing" can handle them.

AI should have a prepared knowledge base, with some supported APIs built-in when facing different operating systems, rather than like now, where even deleting a file requires building a [file-system](github.com/modelcontextprotocol/servers/tree/main/src/filesystem) to implement.

Actually, the AI entry points of major domestic systems are implemented this way. Through xx assistant parsing user voice commands, translating them into specific subtasks that need to be executed.

## Conclusion

MCP protocol, as a transitional design, acts somewhat like establishing an `app store` standard for AI APIs (language/OS-agnostic interfaces for AI). After completing this task, it can be phased out.

![image](/img/in-post/mcp-limitation/ps.gif)
