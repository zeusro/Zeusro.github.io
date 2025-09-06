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
	•	O(1)：只使用常数个额外变量，例如交换两个数。
	•	O(n)：需要开辟与输入规模等长的数组，比如 BFS 队列。
	•	O(n^2)：存储二维矩阵。
	•	O(n \log n)：归并排序时的辅助数组。
	•	O(n!)：存储所有排列结果。

## 时间序列复杂度

时间序列复杂度（Time Series Complexity）描述的是：在满足时间复杂度以及空间复杂度的前置性论述下，算法执行的实际时间以及内存资源的利用效率。

时间序列复杂度是一个二维图表。X轴是t，Y轴是`(used - buff/cache) / total`

时间序列复杂度需要对程序进行可观测性分析。个人比较喜欢指数衰减型。

//oracle:画一个二维坐标系，横轴是t，Y轴是(used - buff/cache) / total ，只需要第一象限，包含指数增长模拟摩尔定律的例子，以及相对称指数衰减图表。

![img](/img/time/Time-Series-Complexity.png)

让我们看看摩尔定律的极限到底在哪里。

## 结论

大鹏展翅恨天低