---
layout:       post
title:        "MCP协议的局限性"
subtitle:     "MCP Limitation"
date:         2025-04-21
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
# 目录
catalog:      true
# 多语言
multilingual: false
published:    true
tags:
    - AI
---

## 回顾

[5年前](https://www.bullshitprogram.com/the-seed-of-robot/)，我把 AI 比喻为一种智能化的 API 网关，提出一种分治的思想，将一个大问题转换为若干可解的小问题，如今，这种思想正在 mcp 这种协议沿用。但目前来看，它的实现方式还是有点丑陋的，并且有一些问题。


```
function solve(problem):
    if problem 小到可以直接解决:
        直接返回结果
    else:
        分成若干个子问题
        分别递归解决子问题
        合并子问题的结果，返回
```


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

mcp 协议里面内置了一个服务发现系统，各个 mcp server 把自身的实现和调用方法注册到里面，然后在调用的时候加到提示词作为参数去请求远程的 AI 服务器，让AI 找到正确的命令然后在本地执行。

比如 gemini function call 大概长这样：

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


![image](/img/in-post/mcp- limitation//传统ai问路.png)


这个计算过程取决于大模型自身的能力，如果是 gemimi-2.0 这种是第一种情况直接一步到位的，而国内其他的白痴模型（特别是百度这种）我就不知道了，因为他们做的垃圾，还有脸收费。

人类，作为外部观察者，通过评估，观察计算产生的影响，补充提示词，诱导ai继续计算，一直修正，直到获取最终结果。


```go
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

我在之前的文章讲到， mcp 协议目前这种实现只能算是次选（过渡方案）。实际上，我觉得现阶段更需要做的事情是“分离函数”，把函数分为 `local function call` 和 `cloud function call` ,对于  `local function call` ，甚至不需要网络都能进行，像是“打开xx应用”，“给我grandma发短信”，像这类需求根本用不到云函数，“离线计算”就能进行。

AI 应该有一个预备的知识库，面对不同的操作系统时内置一些能够支持的api，而不是像现在这样，连删除个文件都要建一个 【file-system】(github.com/modelcontextprotocol/servers/tree/main/src/filesystem) 来实现。

![image](/img/in-post/mcp- limitation//远程本地函数分离.png)


```bash
input --> process --> output -->（评估）influence，考虑是否要执行下一次计算
```

## 结论

MCP 协议作为一种过渡设计，作用有点像是制定一种 AI 的 `app store`标准，完成这个任务之后就可以淘汰。