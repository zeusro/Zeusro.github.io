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
    - P
---

写算法时，需要在 时间 和 空间 之间做平衡（有时用空间换时间，有时用时间换空间）。

但这种思路没有考虑具体执行的实际情况，我们有可能写了一个看起来很优美的程序，但实际上狗屁不通，根本跑不起来。因此，有必要对程序进行可观测性量化分析，通过时间综合检验程序的正确性。

我提出了“时间序列复杂度”和“单位时间序列复杂度”概念，试图补齐衡量算法效益的“最后一公里”。

## 传统时间空间复杂度

**时间复杂度**（Time Complexity）描述的是：算法执行所需的时间与输入规模之间的关系。

一般来说，O(1) < O(\log n) < O(n) < O(n\log n) < O(n^2) < O(2^n) < O(n!)

**空间复杂度**（Space Complexity）描述的是：算法执行过程中所需内存空间与输入规模之间的关系。
它主要反映了算法对内存资源的消耗。

常见空间复杂度：
- O(1)：只使用常数个额外变量，例如交换两个数。
- O(n)：需要开辟与输入规模等长的数组，比如 BFS 队列。
- O(n^2)：存储二维矩阵。
- O(n \log n)：归并排序时的辅助数组。
- O(n!)：存储所有排列结果。

## 时间序列复杂度

**时间序列复杂度**（Time Series Complexity）描述的是：在满足时间复杂度以及空间复杂度的前置性论述下，算法执行的实际时间以及内存资源的利用效率。

时间序列复杂度是一个二维图表。X轴是t，Y轴是`(used - buff/cache) / total`

时间序列复杂度需要对程序进行可观测性分析。个人比较喜欢指数衰减型。

//oracle:画一个二维坐标系，横轴是t，Y轴是(used - buff/cache) / total ，只需要第一象限，包含指数增长模拟摩尔定律的例子，以及相对称指数衰减图表。

![img](/img/time/Time-Series-Complexity.png)

## O(1) “AI”

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

## 伪AI电话

```go
package main

import (
	"fmt"
	"time"
)

// 固定的话术脚本
var script = []string{
	"您好，这里是XX银行智能客服中心。",
	"我们最近推出了一款超低利率的信用贷款产品，年利率低至3.5%。",
	"无需抵押，最快30分钟即可放款，非常适合资金周转。",
	"请问您现在是否需要了解一下具体的办理流程呢？",
	"我们可以根据您的个人情况，提供最高50万的额度支持。",
	"办理过程全程在线，非常简单方便。",
	"如果您有兴趣，我可以帮您安排专属客户经理与您联系。",
	"感谢您的来电，希望我们的贷款产品能帮到您！",
}

func fakeLoanCall() {
	fmt.Println("📞 电话拨号中...")
	time.Sleep(time.Second * 2)
	fmt.Println("AI：嘟嘟嘟……接通成功！")

	for _, line := range script {
		time.Sleep(time.Second * 2)
		fmt.Println("AI：", line)

		// 模拟用户反应
		time.Sleep(time.Second)
		fmt.Println("你：嗯……好的。")
	}
	fmt.Println("📞 通话结束，感谢使用伪AI电话营销系统。")
}

func main() {
	fakeLoanCall()
}
```

```phone
📞 电话拨号中...
AI：嘟嘟嘟……接通成功！
AI： 您好，这里是XX银行智能客服中心。
你： 嗯……好的。
AI： 我们最近推出了一款超低利率的信用贷款产品，年利率低至3.5%。
你： 嗯……好的。
AI： 无需抵押，最快30分钟即可放款，非常适合资金周转。
你： 嗯……好的。
AI： 请问您现在是否需要了解一下具体的办理流程呢？
你： 嗯……好的。
AI： 我们可以根据您的个人情况，提供最高50万的额度支持。
你： 嗯……好的。
AI： 办理过程全程在线，非常简单方便。
你： 嗯……好的。
AI： 如果您有兴趣，我可以帮您安排专属客户经理与您联系。
你： 嗯……好的。
AI： 感谢您的来电，希望我们的贷款产品能帮到您！
你： 嗯……好的。
📞 通话结束，感谢使用伪AI电话营销系统。
```

很多学计算机的书呆子，喜欢按照传统计算机的定义去思考分析问题。但他们没有认识到问题的本身来源于生活。

因此，通过蜉蝣交配这个非常简单的例子，就能解答“时间序列复杂度”这一概念。

## 蜉蝣的空中交配

抓握：雄性成功接近雌性后，会用其细长的前足紧紧抓住雌性的胸部。

体位调整：雄性然后弯曲其腹部末端长长的抱握器，牢牢地箍住雌性的腹部末端。

连接：此时，两只蜉蝣呈现“雄上雌下”的 tandem position（串联姿势），共同飞行。

授精：在连接飞行中，雄性的阴茎会与雌性的受精囊孔对接，将精包（精囊）注入雌性体内。整个交配过程完全在飞行中完成，持续时间从几秒到几分钟不等。

## 单位时间序列复杂度

**单位时间序列复杂度**（Unit Time Series Complexity）是一种复合衡量算法效率的细化公式。
在内存的基础上按需加入CPU/GPU。
用来衡量算法单位资源使用效率。

单位时间序列复杂度是一个三维图表。
不过三维图表过于抽象，一般是降维成2个2维图表。或者合并Y轴，变成一个二维图表的两条曲线。

### 单位CPU时间序列复杂度（Unit CPU Time Series Complexity）

单位CPU时间序列复杂度是一个三维图表。
X轴是t，
Y轴是`(used - buff/cache) / total`，
Z轴是`cpu_load1`。

也可以按需替换成`load5`和`load15`。

- cpu_load1：过去 1 分钟的平均负载
- cpu_load5：过去 5 分钟的平均负载
- cpu_load15：过去 15 分钟的平均负载

### 单位GPU时间序列复杂度（Unit GPU Time Series Complexity）

单位GPU时间序列复杂度是一个三维图表。
X轴是t，
Y轴是`(used - buff/cache) / total`，
Z轴是`gpu_utilization`。

或者把 `gpu_utilization` 换成 `gpu_memory_utilization`。

## 3秒真男人

![image](/img/in-post/three-second/free-m.jpg)

假设TA只有3秒就没了，那么这个函数的横轴区间就是[0,3]，0是相对的瞬时概念，表示“现在”。

3秒后，`free -m` 就归零了，表示“一滴都不剩”了。

单纯从时间角度分析，蜉蝣的交配过程可谓是相当效率。但如果把它换成我的好邻居，那我一般建议他们去看一下男科。

如果他们对象不是很丑的话，我可以考虑顺便照顾一下。

![image](/img/in-post/three-second/forgive.jpg)

## 拓展

Y轴可以换成单位能耗指标，用来规划建设节能型智慧建筑。

与其说纵轴是内存利用率，不如说纵轴表示一种资源的利用效率。

让我们看看摩尔定律的极限到底在哪里吧。

## 结论

大鹏展翅恨天低