
```TXT
    踏上旅程，寻找真我
```

## P=NP之TSP问题的golang证明

![image](/img/USA.png)

[源代码](https://github.com/zeusro/system/tree/main/problems/np)

n < n+1  → P≠NP

按照多维数学假说的基本论述，P=NP在当前的数学符号系统里面是不可解的。

所以，贪婪搜索只能成为近似最优解，之所以近似，第一点在于解法不完全（用球面公式模拟），距离的计算没有完全贴合原意（时间）。

第二点是博弈论的一种理念：“局部最优解不是全局最优解”。
