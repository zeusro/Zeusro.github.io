## 引言

2025-05-03 下飞深圳机场后发现，整个机场从廊桥到外面，全都是支付宝和阿里云的广告。
这让我想起以前有一个“吃豆人”的游戏：在一个xy空间中，2个玩家需要操纵自己的吃豆人，吃光xy空间中所有的豆子。

简单地说，这是一个吃豆人难题：“如何让N个吃豆人尽可能无锁吃到所有豆子（每个豆子只能吃一次）？”
但如果对这个场景进行程序化抽象建模，刚好也是txy空间中2个线程要如何无锁地访问一次性资源这个问题。

结合历史上关于这个问题的解法，我也构思了三个版本的程序和代码。并在第三个版本中，通过平行时空算法模拟实现了“量子在N维空间中的运动”。

## 形式逻辑和定义

量子：物理系统中某一物理量（如能量、角动量、电荷）所能取的最基本、不可再分割的离散单位。

算子：某个函数空间或向量空间上的映射。

N维空间：以时间作为第一轴的N维度空间。比如tx是（时序）二维空间，txy是（时序）三维空间，txyz是（时序）四维空间。

<img src="/img/pay.png" alt="pay" style="width:40%; height:auto; display:block;">

平行时空算法：通过分配多个内存空间，平行地构建多个N维空间，让每一个算子/量子在各自的N维空间中运动，最后以时间为键收敛，从而得到并发线程无锁地访问一次性资源的解法。
这种解法我称为平行时空算法。

算子碰撞：两个算子在相同时间下发生的接触。以“吃豆人”为例，算子碰撞指的是两个“吃豆人”同时访问受限资源。

时序不动点：角谷不动点在（非）欧几里得空间的一般性推广。由于欧几里得空间不包含“意识”的定义，因此角谷不动点其实是时序不动点的特殊情况。时序不动点，可以按照实际需要降维成角谷不动点，具体要按照具体场景，才可以进行说明。

点：使用 `golang struct`模拟实现的直角坐标系二维结构。

```go
// 定义点结构
type Point struct {
	X float64
	Y float64
}
```

线段：使用 `golang struct`模拟实现的结构。

```go
type Line struct {
	A Point
	B Point
}
```

线段的长度：以随机时间作为衡量N维线段长度的唯一标准。

```go
// Distance 以随机时间作为衡量N维线段长度的唯一标准
func (l Line) Distance() time.Duration {
	// 计算欧几里得距离
	dx := l.A.X - l.B.X
	dy := l.A.Y - l.B.Y
	dist := math.Sqrt(dx*dx + dy*dy)

	// 将距离映射到 1ms~1000ms 之间（对数映射让增长更平滑）
	ms := 1 + int64(999*math.Tanh(dist/10)) // 距离大时趋近于1000ms

	// 加上 ±10% 的随机扰动
	jitter := rand.Float64()*0.2 - 0.1
	ms = int64(float64(ms) * (1 + jitter))

	if ms < 1 {
		ms = 1
	} else if ms > 1000 {
		ms = 1000
	}
	return time.Duration(ms) * time.Millisecond
}
```

## 基于读写锁的一次性循环时间抢占解法

如果把地图上面所有的豆子当成一种独占资源，那么以序号作为键，以地图上面的点作为值，就可以建立一个基于读写锁的字典：

 ```go
 // Beans 结构：内置并发字典 key->Point
type Beans struct {
	mu    sync.RWMutex
	items map[int]model.Point
}
```

2个线程，基于时间的快慢，对独占资源进行抢夺，所需时间少的胜出，这样即可得出最终答案。

```go
type RWLock struct {
}

// GetCost 通过O(n)的读写锁解题
func (lock RWLock) GetCost() time.Duration {
	start := time.Now()
	end := time.Now()

	m := map[int]model.Point{}
	n := 50
	for i := 0; i < n; i++ {
		p := model.RandonPoint()
		m[i] = p
		// fmt.Println(p)
	}
	beans := NewBeans(m)
	//简化问题，把随机初始两点作为吃豆人起点
	a := make([]model.Point, 1)
	a[0] = m[0]
	beans.GetAndRemove(0)
	b := make([]model.Point, 1)
	b[0] = m[1]
	beans.GetAndRemove(1)
	alipay := AlibabaCompany{}
	aliyun := AlibabaCompany{}
	for i := 2; i < n; i++ {
		p, _ := beans.GetAndRemove(i)
		line1 := model.NewLine(a[len(a)-1], p)
		// fmt.Println(line1.Distance())
		line2 := model.NewLine(b[len(b)-1], p)
		// fmt.Println(line2.Distance())
		t1 := line1.Distance()
		t2 := line2.Distance()
		if t1 < t2 {
			// a = append(a, p)
			end = end.Add(t1)
			alipay.Lines = append(alipay.Lines, line1)
		} else {
			// b = append(b, p)
			end = end.Add(t2)
			aliyun.Lines = append(aliyun.Lines, line2)
		}
	}
	// fmt.Println(a)
	// fmt.Println(b)
	alipayBeans := make([]model.Bean, 0)
	for _, item := range alipay.Lines {
		alipayBeans = append(alipayBeans, model.Bean{Line: item})
	}
	beansA := alipay.EatBeans(alipayBeans)
	fmt.Println("支付宝吃豆人：")
	fmt.Println(beansA)

	aliyunBeans := make([]model.Bean, 0)
	for _, item := range aliyun.Lines {
		aliyunBeans = append(aliyunBeans, model.Bean{Line: item})
	}
	beansB := aliyun.EatBeans(aliyunBeans)
	fmt.Println("阿里云吃豆人：")
	fmt.Println(beansB)

	return end.Sub(start)
}
```

这里的解法，是基于单线程的时间抢占，如果用 `go routine`，就要实现传统的读写锁式解法，这里不再赘述。

完整解法见：
 [v1](https://github.com/zeusro/system/tree/main/function/local/n/china/shenzhen/szx/v1)

## 单线程消息队列解法

如果把阿里云和支付宝看成一个整体（它们都归属于阿里巴巴集团），那么就可以将N个吃豆人转换为1个吃豆人问题，使用简单的异步消息队列解题：

```go
type Information struct {
	date    time.Time
	content string
}

type AlibabaGroup struct {
	N    int           //算法规模
	Cost time.Duration //总耗时
	model.Alipay
	model.Aliyun
}

func (a *AlibabaGroup) Actor(core string, inbox <-chan Information) {
	for msg := range inbox {
		fmt.Printf("[%v]Actor %s received[%d]: %s\n", msg.date, core, a.N, msg.content)
		a.N++
	}
}

// EatBean 如果把问题转换为一个整体（阿里云和支付宝同属阿里巴巴集团的资产），那么问题就可以简化为一个简单的生产者消费者模型
func (ali *AlibabaGroup) EatBean(beans []model.Bean) map[time.Time]model.Point {
	var m map[time.Time]model.Point = make(map[time.Time]model.Point)
	now := time.Now()
	start := now
	// fmt.Println(start)
	n := len(beans)
	var wg sync.WaitGroup
	memory := make(chan Information, 1) //限定为1，强转为同步队列结构
	wg.Add(1)
	go func() {
		defer wg.Done()
		ali.Actor("1A84", memory)
	}()
	a := model.RandonPoint()
	m[now] = a
	memory <- Information{content: "立ち上がれ、江崎プリン！"}
	memory <- Information{date: start, content: fmt.Sprintf("(%f,%f)", a.X, a.Y)}
	cache := make(map[float64]float64)
	for i := 0; i < n-1; i++ {
		b := model.RandonPoint()
		notIn := true
		for notIn {
			if _, contains := cache[b.X]; contains {
				b = model.RandonPoint()
				continue
			} else {
				cache[b.X] = b.Y
				notIn = false
				break
			}
		}
		line := model.NewLine(a, b)
		now = now.Add(line.Distance())
		m[now] = b
		memory <- Information{date: now, content: fmt.Sprintf("(%f,%f)", b.X, b.Y)}
	}
	// fmt.Println(now)
	// fmt.Printf("cost: %v \n", ali.GetCost())
	ali.Cost = now.Sub(start)
	memory <- Information{date: time.Now(), content: fmt.Sprintf("cost: %v", ali.GetCost())}
	close(memory)
	wg.Wait()
	return m
}

func (ali *AlibabaGroup) GetCost() time.Duration {
	return ali.Cost
}
```

也可以称为`江崎プリン`解法。

完整代码见
[v2](https://github.com/zeusro/system/tree/main/function/local/n/china/shenzhen/szx/v2)

## 平行时空算法

平行时空算法，简单地说是划分出两块相同的txy内存空间，让n个线程各自在自己的N维空间中运动，最后通过字典去重，归一化合并。

解法跟“基于读写锁的一次性循环时间抢占解法”有点类似，但对元数据对象进行了重新建模，扩充了N维线段的定义。

```go
// NLine 基于时间的n维线段
type NLine struct {
	t       time.Time
	actorID string
	model.Line
}

type Journey struct {
	Lines  []model.Line             //N维线段（为了简化运算不引入时间）的二维线段数组表示
	NBeans map[model.Bean]time.Time //N维对象
}
```

在 `Beans` 中承载N维线段。

```go
// Beans 结构：内置并发字典 key->Point
// 为了0依赖直接拷贝v1版本，不使用继承
type Beans struct {
	Name    string
	mu      sync.RWMutex
	items   map[int]model.Point
	FirstNL NLine
}

func (beans *Beans) Thought(n int, date time.Time) *Journey {
	//简化问题，把随机初始点作为吃豆人起点
	a := make([]model.Point, 1)
	first, _ := beans.GetAndRemove(0)
	journey := NewJourney(n - 1)
	a[0] = first
	// n个点只能产生n-1个线段
	for i := 1; i < n; i++ {
		p, contains := beans.GetAndRemove(i)
		if !contains {
			break
		}
		line := model.NewLine(a[len(a)-1], p)
		// fmt.Printf("%d:%s\n", i, line.String())
		date = date.Add(line.Distance())
		journey.AddLine(date, i-1, line)
		if i == 1 {
			line := model.NewLine(a[0], p)
			beans.FirstNL = NLine{t: date, actorID: beans.Name, Line: line}
		}
		//重置条件，为下一轮做准备
		a = append(a, p)
	}
	result, err := journey.Validate()
	if !result || err != nil {
		fmt.Println("Journey 验证失败：", err)
		return journey
	}
	return journey
}
```

解法的核心是 `DoubleThought` 算法——通过比对每一段N维线段的长度，剔除掉耗时较长的N维线段，这样在最后归一化的时候，就能得到完整的N维线段。

```go
func DoubleThought(n int) []NLine {
	m := make(map[int]model.Point, n)
	for i := 1; i < n; i++ {
		m[i] = model.RandonPoint()
	}
	p1 := model.RandonPoint()
	p2 := model.RandonPoint()
	//强制分配不同的起点
	for p1.Compare(p2) {
		p2 = model.RandonPoint()
	}
	bean1 := NewBeansWithFirstPoint(p1, m)
	bean1.Name = "aliyun"
	bean2 := NewBeansWithFirstPoint(p2, m)
	bean2.Name = "alipay"

	now := time.Now()
	journey1 := bean1.Thought(n, now)
	journey2 := bean2.Thought(n, now)
	//归一化合并，去掉多余的点。
	nLines := make(map[time.Time]NLine)
	nMap := NewNLineMap(0)
	for k, t1 := range journey1.NBeans {
		t2, ok := journey2.NBeans[k]
		if !ok {
			continue
		}
		//落后就要挨打
		if t1.After(t2) {
			delete(journey1.NBeans, k)
			line := NLine{t: t2, Line: k.Line, actorID: bean2.Name}
			nLines[t2] = line
			nMap.Add(t2, line)
			continue
		}
		if t2.After(t1) {
			delete(journey2.NBeans, k)
			line := NLine{t: t1, Line: k.Line, actorID: bean1.Name}
			nLines[t1] = line
			nMap = nMap.Add(t1, line)
			continue
		}
		//由于字典会自动去重，因此碰撞可以忽略
		fmt.Printf("%v:%v 两个吃豆人同时到达%v，发生碰撞\n", t1, t2, k.Line)
	}
	nMap.AddZero(bean1.FirstNL)
	nMap.AddZero(bean2.FirstNL)
	fmt.Printf("%v : n维线段总数：%d;吃豆人%v总数%v;吃豆人%v总数%v;\n", now,
		len(nMap.items)+2, bean1.Name, len(journey1.NBeans), bean2.Name, len(journey2.NBeans))
	lines := nMap.All(false)
	fmt.Printf("len(lines):%v\n", len(lines))
	for k, v := range lines {
		fmt.Printf("%v:%v\n", k, v.String())
	}
	fmt.Println(journey1.End())
	return lines
}
```

以50个点作为算法规模，运行一次测试用例进行分析。

```go
func TestDoubleThought(t *testing.T) {
	lines := DoubleThought(50)
	t.Logf("len(lines)：%v", len(lines))
}
```

结果如下：

```bash
go test -run TestDoubleThought -v
=== RUN   TestDoubleThought
2025-11-17 08:08:01.473679 +0800 CST m=+0.000456626 : n维线段总数：50;吃豆人aliyun总数21;吃豆人alipay总数29;
len(lines):50
0:2025-11-17 08:08:02.411679 +0800 CST m=+0.938456626 aliyun:(298.780000,815.780000)-(672.440000,359.620000)
1:2025-11-17 08:08:02.473679 +0800 CST m=+1.000456626 alipay:(511.320000,964.490000)-(672.440000,359.620000)
2:2025-11-17 08:08:03.396679 +0800 CST m=+1.923456626 alipay:(672.440000,359.620000)-(395.370000,5.850000)
3:2025-11-17 08:08:04.360679 +0800 CST m=+2.887456626 alipay:(395.370000,5.850000)-(358.670000,960.680000)
4:2025-11-17 08:08:05.360679 +0800 CST m=+3.887456626 alipay:(358.670000,960.680000)-(958.880000,262.260000)
5:2025-11-17 08:08:06.360679 +0800 CST m=+4.887456626 alipay:(958.880000,262.260000)-(905.450000,363.990000)
6:2025-11-17 08:08:07.325679 +0800 CST m=+5.852456626 aliyun:(905.450000,363.990000)-(85.370000,108.550000)
7:2025-11-17 08:08:08.246679 +0800 CST m=+6.773456626 aliyun:(85.370000,108.550000)-(529.910000,319.270000)
8:2025-11-17 08:08:09.246679 +0800 CST m=+7.773456626 aliyun:(529.910000,319.270000)-(276.950000,810.310000)
9:2025-11-17 08:08:10.226679 +0800 CST m=+8.753456626 aliyun:(276.950000,810.310000)-(906.840000,44.780000)
10:2025-11-17 08:08:11.198679 +0800 CST m=+9.725456626 aliyun:(906.840000,44.780000)-(967.720000,16.610000)
11:2025-11-17 08:08:12.113679 +0800 CST m=+10.640456626 aliyun:(967.720000,16.610000)-(516.300000,716.420000)
12:2025-11-17 08:08:13.079679 +0800 CST m=+11.606456626 aliyun:(516.300000,716.420000)-(105.700000,685.490000)
13:2025-11-17 08:08:14.079679 +0800 CST m=+12.606456626 aliyun:(105.700000,685.490000)-(19.750000,15.090000)
14:2025-11-17 08:08:15.079679 +0800 CST m=+13.606456626 aliyun:(19.750000,15.090000)-(76.770000,180.880000)
15:2025-11-17 08:08:16.063679 +0800 CST m=+14.590456626 aliyun:(76.770000,180.880000)-(727.670000,289.990000)
16:2025-11-17 08:08:17.011679 +0800 CST m=+15.538456626 aliyun:(727.670000,289.990000)-(240.910000,904.420000)
17:2025-11-17 08:08:17.967679 +0800 CST m=+16.494456626 aliyun:(240.910000,904.420000)-(642.670000,776.750000)
18:2025-11-17 08:08:18.967679 +0800 CST m=+17.494456626 aliyun:(642.670000,776.750000)-(464.890000,982.530000)
19:2025-11-17 08:08:19.922679 +0800 CST m=+18.449456626 aliyun:(464.890000,982.530000)-(717.590000,843.910000)
20:2025-11-17 08:08:20.922679 +0800 CST m=+19.449456626 aliyun:(717.590000,843.910000)-(963.660000,432.870000)
21:2025-11-17 08:08:21.922679 +0800 CST m=+20.449456626 aliyun:(963.660000,432.870000)-(601.450000,179.600000)
22:2025-11-17 08:08:22.888679 +0800 CST m=+21.415456626 aliyun:(601.450000,179.600000)-(341.830000,893.180000)
23:2025-11-17 08:08:23.888679 +0800 CST m=+22.415456626 aliyun:(341.830000,893.180000)-(579.760000,573.240000)
24:2025-11-17 08:08:24.870679 +0800 CST m=+23.397456626 alipay:(579.760000,573.240000)-(641.170000,49.050000)
25:2025-11-17 08:08:25.832679 +0800 CST m=+24.359456626 alipay:(641.170000,49.050000)-(101.750000,225.440000)
26:2025-11-17 08:08:26.751679 +0800 CST m=+25.278456626 alipay:(101.750000,225.440000)-(912.300000,764.630000)
27:2025-11-17 08:08:27.679679 +0800 CST m=+26.206456626 alipay:(912.300000,764.630000)-(213.550000,944.980000)
28:2025-11-17 08:08:28.602679 +0800 CST m=+27.129456626 alipay:(213.550000,944.980000)-(9.110000,984.800000)
29:2025-11-17 08:08:29.554679 +0800 CST m=+28.081456626 alipay:(9.110000,984.800000)-(483.620000,64.960000)
30:2025-11-17 08:08:30.554679 +0800 CST m=+29.081456626 alipay:(483.620000,64.960000)-(247.460000,965.040000)
31:2025-11-17 08:08:31.454679 +0800 CST m=+29.981456626 alipay:(247.460000,965.040000)-(613.010000,276.260000)
32:2025-11-17 08:08:32.422679 +0800 CST m=+30.949456626 alipay:(613.010000,276.260000)-(722.210000,687.830000)
33:2025-11-17 08:08:33.422679 +0800 CST m=+31.949456626 alipay:(722.210000,687.830000)-(594.410000,11.680000)
34:2025-11-17 08:08:34.422679 +0800 CST m=+32.949456626 alipay:(594.410000,11.680000)-(439.150000,666.000000)
35:2025-11-17 08:08:35.371679 +0800 CST m=+33.898456626 aliyun:(439.150000,666.000000)-(160.780000,393.220000)
36:2025-11-17 08:08:36.316679 +0800 CST m=+34.843456626 aliyun:(160.780000,393.220000)-(325.120000,891.420000)
37:2025-11-17 08:08:37.240679 +0800 CST m=+35.767456626 alipay:(325.120000,891.420000)-(217.600000,767.350000)
38:2025-11-17 08:08:38.148679 +0800 CST m=+36.675456626 alipay:(217.600000,767.350000)-(140.930000,107.440000)
39:2025-11-17 08:08:39.089679 +0800 CST m=+37.616456626 alipay:(140.930000,107.440000)-(988.020000,54.670000)
40:2025-11-17 08:08:40.089679 +0800 CST m=+38.616456626 alipay:(988.020000,54.670000)-(174.380000,807.730000)
41:2025-11-17 08:08:41.089679 +0800 CST m=+39.616456626 alipay:(174.380000,807.730000)-(871.380000,262.260000)
42:2025-11-17 08:08:42.089679 +0800 CST m=+40.616456626 alipay:(871.380000,262.260000)-(817.310000,643.470000)
43:2025-11-17 08:08:43.089679 +0800 CST m=+41.616456626 alipay:(817.310000,643.470000)-(493.880000,409.690000)
44:2025-11-17 08:08:44.073679 +0800 CST m=+42.600456626 alipay:(493.880000,409.690000)-(639.780000,477.530000)
45:2025-11-17 08:08:44.986679 +0800 CST m=+43.513456626 alipay:(639.780000,477.530000)-(620.170000,232.800000)
46:2025-11-17 08:08:45.986679 +0800 CST m=+44.513456626 alipay:(620.170000,232.800000)-(478.940000,510.630000)
47:2025-11-17 08:08:46.986679 +0800 CST m=+45.513456626 alipay:(478.940000,510.630000)-(613.300000,448.740000)
48:2025-11-17 08:08:47.986679 +0800 CST m=+46.513456626 alipay:(613.300000,448.740000)-(970.500000,777.290000)
49:2025-11-17 08:08:48.986679 +0800 CST m=+47.513456626 alipay:(970.500000,777.290000)-(825.030000,571.680000)
关于这趟旅程我还能说啥呢，总比宅在家里玩 Nintendo Switch 好多了
    double_thought_test.go:15: len(lines)：50
```

在 `DoubleThought` 算法中，由于给初始的“吃豆人”强制分配了2个不同的随机位置，相当于有51个点，因此最终产生的N维线段(n个点产生n-1条线段)有50个。

```go
p1 := model.RandonPoint()
p2 := model.RandonPoint()
	//强制分配不同的起点
	for p1.Compare(p2) {
		p2 = model.RandonPoint()
	}
```

程序运行每一次出来的结果都是随机的，而且会有概率发生“算子碰撞“——即同一个时刻有n个算子同时访问相同的点。

但是第1|2|n段N维线段必定符合B点相同的特征：

```bash
0:2025-11-17 08:08:02.411679 +0800 CST m=+0.938456626 aliyun:(298.780000,815.780000)-(672.440000,359.620000)
1:2025-11-17 08:08:02.473679 +0800 CST m=+1.000456626 alipay:(511.320000,964.490000)-(672.440000,359.620000)
2:2025-11-17 08:08:03.396679 +0800 CST m=+1.923456626 alipay:(672.440000,359.620000)-(395.370000,5.850000)
```

 `(672.440000,359.620000)`这个点就是时序不动点。因为不管程序如何随机运行，不管有多少随机线程，这N个随机线程初次到达的必定是同一个点。

从当前的传统三维角度，这是一种矛盾。因为原题是计算机的“受限资源”，每次只能由一个线程访问。但从N维空间角度上看，这并不矛盾。

因为按照量子纠缠态特征，同时观察无法确定是1个点，还是2个点，或者是n个点。

这是以时间作为键，设计出来的一种无锁多线程解题方案，同时也是N维空间量子运动的程序化解释。

完整算法见：
[v3](https://github.com/zeusro/system/tree/main/function/local/n/china/shenzhen/szx)

## 结论

殊途同歸終須別，時來運去皆無常

## 参考文献

[1] 
运动的量子化解释(2025)
https://github.com/zeusro/quantum/blob/main/README.zh.md

## 已经发表和待发表的论文

1. Zeusro（2025）时间是超越物质与意识的第一维度 https://github.com/zeusro/quantum/blob/main/t.zh.md
1. Zeusro（2025）运动的量子化解释 https://github.com/zeusro/quantum/blob/main/README.zh.md

## 致谢

[『攻殻機動隊 SAC_2045』](（https://www.ghostintheshell-sac2045.jp/）)に感謝
