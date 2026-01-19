在[5年前](https://www.bullshitprogram.com/the-seed-of-robot/)，我把 AI 比喻为一种智能化的 API 网关，提出一种分治的思想，将一个大问题转换为若干可解的小问题。

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

就像上面的递归求和函数——将数组一分为二，分别递归求和。

如今，这种思想正在 [MCP](https://modelcontextprotocol.io/introduction) 这种协议沿用。

在2025-04那段时间，我使用 `cline` 搭配 `Google gemini` 作为底层大模型“内核”,研究了一下大语言模型调用 MCP 这套完整协议。

但目前来看，MCP的实现方式还是有点丑陋的，并且有一些问题。
而且由于大模型自身的问题，会导致多余的 token 消耗。

## 现状

MCP 协议里面内置了一个服务发现系统，各个 MCP server 把自身的实现和调用方法注册到里面，然后在调用的时候加到提示词，作为参数去请求远程的 AI 服务器，让AI 找到正确的命令然后在本地执行。

比如 [Gemini Function Call](https://ai.google.dev/gemini-api/docs/function-calling?hl=zh-cn) 大概长这样：

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

整个过程可能非常繁复。比如，我们向AI下令“删除桌面上所有截图”的时候，最理想的指令是：

```bash
find /Users/zeusro/Desktop -type f -name "Screenshot*.png" -delete && find /Users/zeusro/Desktop -type f -name "Screenshot*.jpg" -delete
```

但实际的执行过程可能是：

1. 找到这个路径上面所有文件，获取相应路径
1. 删除截图图片1
1. 删除截图图片2
1. 删除截图图片n

![image](/img/in-post/mcp-limitation//传统ai问路.png)

这个计算过程取决于大模型自身的能力，如果是 gemini-2.0 这种是第一种情况直接一步到位的，而国内其他模型基本不开放免费API，我基本上不用。

```bash
input --> process --> output -->（评估）influence，考虑是否要执行下一次计算
```

人类，作为外部观察者，通过评估，观察计算产生的影响，补充提示词，诱导ai继续计算，一直修正，直到获取最终结果。

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

以代码项目管理的层面去解读，AI与人的关系像是“开发”和“评审人员”，由评审人员决定是否要“并入”代码。

## local function 和 cloud function

在2020年的时候，我以打车作为例子，提出了`Cloud Function` 。

`Cloud Function` 指的是一种依赖云端软硬件资源来完成辅助计算的函数。

而与 `Cloud Function` 相对应的，是`Local Function`。

`Local Function` 指的是一种离线计算的函数。
狭义的`Local Function` 不需要网络就能进行，一般可以理解为操作系统的API；广义的`Local Function`指的是本地硬件的局部函数。
像是手机端北京时间的获取——虽然手机有内置时钟，但是时间需要周期地从国家授时中心同步。

这就有点像我们家里的闹钟——虽然给它电池就能转，但由于时间的偏移，我们也需要定期人工校准时间。

## `local function call` 和 `cloud function call` 分离

![image](/img/in-post/mcp-limitation/远程本地函数分离.png)

但在我看来， MCP 协议目前这种实现只能算是次选（过渡方案）。
实际上，我觉得现阶段更需要做的事情是“分离函数”，把函数分为 `local function call` 和 `cloud function call` ,对于  `local function call` ，
甚至不需要网络都能进行，像是“打开xx应用”，“给我grandma发短信”，像这类需求根本用不到云函数，“离线计算”就能进行。

AI 应该有一个预备的知识库，面对不同的操作系统时内置一些能够支持的api，而不是像现在这样，连删除个文件都要建一个 [file-system](github.com/modelcontextprotocol/servers/tree/main/src/filesystem) 来实现。

实际上，目前各大国产系统的AI入口就是这样实现的。通过xx助理解析用户的语音指令，将他们翻译成具体需要执行的子任务。

## 结论

MCP 协议作为一种过渡设计，作用有点像是制定一种 AI API(面向AI的语言/操作系统无关接口)的 `app store`标准，完成这个任务之后就可以淘汰。

![image](/img/in-post/mcp-limitation/ps.gif)