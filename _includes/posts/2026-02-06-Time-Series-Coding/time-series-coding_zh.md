
由于时间序列库原始的论文(http://github.com/zeusro/data)已经丢失了，我只能按照有限的回忆一点点拼凑起时间序列那部分的内容。

只有经过时间的实践，才能验证程序的正确性。因此我提出时间序列元编程模型。这是一种对现实世界提出建模的新程序范式，是编程语言无关的设计哲学。

在此基础上引入**时间序列复杂度**：在满足传统时间/空间复杂度前提下，用二维图（t 与内存利用率等）乃至三维图（加入 CPU/GPU 负载）刻画算法实际耗时与资源利用。


## 时间序列

**时间序列**：按时间顺序排列、记录同一对象状态随时间变化的一组数据。
时间序列只有`Watch`作为唯一API。`Watch`可以按照顺序分化为`Read`和`Write`接口。

## 时间序列对象

时间序列对象，时间必须是第一成员，并且在初始化函数中体现。
基于时间而生成的数据都是时序数据。

```go
type DeadMonkey struct {
	Birth       time.Time
	GoldenStaff []NLine //金箍棒 参数化线段（Parametric Segment）
	m           int     //消费者规模
	n           int     //算法规模
	ZeroPoints  []model.Point
	cost        time.Duration
}
```

## 时间序列函数

时间序列函数，时间必须是第一成员。返回参数第一成员必须是时间序列对象。
传入的时间与传出的时间，表示函数的时间上下界。

```go
// NewDeadMonkey
// m 作战对象
// n 唯一资源数/算法规模
func NewDeadMonkey(birth time.Time, m, n int) *DeadMonkey {
	dead := DeadMonkey{
		Birth: birth,
		m:     m,
		n:     n,
	}
	zeroPoints := make([]model.Point, m)
	p0 := model.RandonPoint()
	zeroPoints[0] = p0
	for i := 1; i < m; i++ {
		p1 := model.RandonPoint()
		//只要不跟前面的点重复就行，全局重复也忽略了
		for p1.Compare(zeroPoints[i-1]) {
			p1 = model.RandonPoint()
		}
		zeroPoints[i] = p1
	}
	dead.ZeroPoints = zeroPoints
	return &dead
}

// SleepAndReturnNewTime 接收一个时间参数，随机 sleep 一段时间后返回最新时间
func SleepAndReturnNewTime(inputTime time.Time) time.Time {
    // 设置随机种子
    rand.Seed(time.Now().UnixNano())

    // 生成随机的 sleep 时间，范围为 1 到 5 秒
    sleepDuration := time.Duration(rand.Intn(5)+1) * time.Second

    // Sleep 随机时间
    time.Sleep(sleepDuration)

    // 返回当前时间
    return time.Now()
}
```

## 时间序列距离

使用时间+其他条件的复合判断（比如在4维球面中，可以只使用距离作为换算；也可以使用时间+Haversine公式换算）。

## 时间序列日志

打印内容必须是“时间+内容”的格式。

## 时间序列复杂度

时间序列复杂度（Time Series Complexity）：在满足时间复杂度以及空间复杂度的前置性论述下，算法执行的实际时间以及内存资源的利用效率。

时间序列复杂度是一个二维图表。X轴是t，Y轴是`(used - buff/cache) / total`。

Y轴可以按照实际需要，使用其他的标准，比如CPU/GPU的整体利用率。

单位时间序列复杂度是一个三维图表。 不过三维图表过于抽象，可以降维成2个2维图表。或者合并Y轴，变成一个二维图表的两条曲线。

**单位CPU时间序列复杂度**是一个三维图表。 X轴是t， Y轴是(used - buff/cache) / total， Z轴是cpu_load1。

**单位GPU时间序列复杂度**是一个三维图表。 X轴是t， Y轴是(used - buff/cache) / total， Z轴是gpu_utilization。

时间序列复杂度需要对程序进行可观测性分析。

## 时间序列空间

由时间序列组成的2维以上空间。