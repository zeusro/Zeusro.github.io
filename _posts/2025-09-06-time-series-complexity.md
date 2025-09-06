---
layout:       post
title:          "时间序列复杂度"
subtitle:     "Time Series Complexity"
date:         2025-09-06
author:       "Zeusro"
header-img:   "img/b/2025/JumpOutTheSky.jpeg"
header-mask:  0.3
# 目录
catalog:      true
# 多语言
multilingual: false
published:    true
tags:
    - time
---

## 传统时间空间复杂度

时间复杂度（Time Complexity）描述的是：算法执行所需的时间与输入规模之间的关系。

一般来说，O(1) < O(\log n) < O(n) < O(n\log n) < O(n^2) < O(2^n) < O(n!)

空间复杂度（Space Complexity）描述的是：算法执行过程中所需内存空间与输入规模之间的关系。
它主要反映了算法对内存资源的消耗。

常见空间复杂度：
- O(1)：只使用常数个额外变量，例如交换两个数。
- O(n)：需要开辟与输入规模等长的数组，比如 BFS 队列。
- O(n^2)：存储二维矩阵。
- O(n \log n)：归并排序时的辅助数组。
- O(n!)：存储所有排列结果。

## 时间序列复杂度

时间序列复杂度（Time Series Complexity）描述的是：在满足时间复杂度以及空间复杂度的前置性论述下，算法执行的实际时间以及内存资源的利用效率。

时间序列复杂度是一个二维图表。X轴是t，Y轴是`(used - buff/cache) / total`

时间序列复杂度需要对程序进行可观测性分析。个人比较喜欢指数衰减型。

//oracle:画一个二维坐标系，横轴是t，Y轴是(used - buff/cache) / total ，只需要第一象限，包含指数增长模拟摩尔定律的例子，以及相对称指数衰减图表。

![img](/img/time/Time-Series-Complexity.png)

## 例子

时间序列复杂度的这一概念，破除了传统时间空间算法复杂度的浅层优劣问题。说点人话，你可以用一个看起来很傻帽的程序去模拟AI，只要这个“AI”能骗到人（通过图灵测试）。

```go
package main

import "fmt"

func main() {
    fmt.Println("你：嗨，AI，你好吗？")
    aiReply("嗨，AI，你好吗？")
}

func aiReply(input string) {
    if input == "嗨，AI，你好吗？" {
        fmt.Println("AI：我很好，谢谢你！你呢？")
        if true { // 人继续问
            fmt.Println("你：我也不错，你会讲笑话吗？")
            if true { // AI 回答
                fmt.Println("AI：当然，会的！你想听一个冷笑话还是热笑话？")
                if true { // 人选择
                    fmt.Println("你：给我一个冷笑话吧。")
                    if true { // AI 输出
                        fmt.Println("AI：为什么计算机很冷？因为它总是在处理冷数据！")
                        if true { // 人继续
                            fmt.Println("你：哈哈，还有吗？")
                            if true {
                                fmt.Println("AI：还有啊，为什么AI不喜欢夏天？因为它怕被训练成热模型！")
                                if true {
                                    fmt.Println("你：太好笑了，你会自己讲笑话吗？")
                                    if true {
                                        fmt.Println("AI：嗯……让我想想……你知道程序员最怕的是什么吗？")
                                        if true {
                                            fmt.Println("你：是什么？")
                                            if true {
                                                fmt.Println("AI：被无限循环困住！")
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
```

这个程序按照传统时间空间算法去计算，都是O(1)。

或者换一种思路，你可以用一台十年前的安卓机去证明自己，也可以找你爸要一个亿,买一台带超强GPU的至强服务器，去算1+1=2。这就是一种个人选择，无关乎对错问题。

甚至纵轴可以换成单位能耗指标，用来建设节能型智慧建筑。

与其说纵轴是内存利用率，不如说纵轴表示一种资源的利用效率。

让我们看看摩尔定律的极限到底在哪里吧。

## 结论

大鹏展翅恨天低