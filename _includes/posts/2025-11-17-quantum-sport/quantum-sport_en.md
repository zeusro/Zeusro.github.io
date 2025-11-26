## Introduction

After landing at Shenzhen Airport on May 3, 2025, I noticed that the entire airport—from the jet bridges to the exterior—was plastered with advertisements for Alipay and Alibaba Cloud.
This reminded me of an old Pac-Man game: in an xy grid, two players control their Pac-Man characters to eat all the pellets scattered across the grid.

Simply put, this is the Pac-Man problem: “How can N Pac-Men consume all pellets without locking (each pellet can only be eaten once)?”
However, if we programmatically abstract and model this scenario, it precisely mirrors the problem of two threads in a txy space accessing a single-use resource without locking.

Drawing from historical solutions to this problem, I conceived three versions of programs and code. In the third version, I simulated “quantum motion in N-dimensional space” using a parallel-time algorithm.

## Formal Logic and Definitions

Quantum: The most fundamental, indivisible discrete unit that a physical quantity (such as energy, angular momentum, or charge) can assume in a physical system.

Operator: A mapping on a function space or vector space.

N-dimensional Space: An N-dimensional space with time as its first axis. For example, tx is a (temporal) two-dimensional space, txy is a (temporal) three-dimensional space, and txyz is a (temporal) four-dimensional space.

<img src="/img/pay.png" alt="pay" style="width:40%; height:auto; display:block;">

Parallel-Space Algorithm: By allocating multiple memory spaces, it constructs multiple N-dimensional spaces in parallel. Each operator/quantum moves within its own N-dimensional space, ultimately converging with time as the key. This provides a solution for concurrent threads to access one-time resources without locks.
I refer to this solution as the Parallel-Space Algorithm.

Operator Collision: Contact between two operators occurring at the same time. Using Pac-Man as an example, operator collision refers to two Pac-Man entities simultaneously accessing a restricted resource.

Temporal Fixed Point: A general extension of the Kakutani fixed point to (non-)Euclidean spaces. Since Euclidean spaces lack a definition for “consciousness,” the Kakutani fixed point is actually a special case of the temporal fixed point. Temporal fixed points can be dimension-reduced to Kakutani fixed points as needed, with specifics determined by the context.

Point: A two-dimensional structure modeled using a `golang struct` in a Cartesian coordinate system.

```go
// Define point structure
type Point struct {
    X float64
    Y float64
}
```

Line Segment: A structure implemented using `golang struct`.

```go
type Line struct {
    A Point
    B Point
}
```

Line Segment Length: Random time serves as the sole criterion for measuring the length of an N-dimensional line segment.

```go
// Distance 以随机时间作为衡量N维线段长度的唯一标准
func (l Line) Distance() time.Duration {
	// 计算欧几里得距离
	dx := l.A.X - l.B.X
	dy := l.A.Y - l.B.Y
	dist := math.Sqrt(dx*dx + dy*dy)

	// 将距离映射到 1ns ~ 1_000_000ns（1ms）之间，使用平滑的双曲正切映射
	ns := 1 + int64(999999*math.Tanh(dist/10))

	// 加上 ±10% 的随机扰动
	jitter := rand.Float64()*0.2 - 0.1
	ns = int64(float64(ns) * (1 + jitter))

	// 限制范围
	if ns < 1 {
		ns = 1
	} else if ns > 100_0000 {
		//Go 允许在整数或浮点数字面量中加 _ 来分隔位数：
		ns = 100_0000
	}
	return time.Duration(ns) * time.Nanosecond
}
```

## One-Time Cycle Time Preemption Solution Using Read-Write Locks

If we treat all beans on the map as a single exclusive resource, we can create a dictionary based on read-write locks using the bean ID as the key and the corresponding point on the map as the value:

```go
// Beans structure: Built-in concurrent dictionary key->Point
type Beans struct {
    mu    sync.RWMutex
    items map[int]model.Point
}
```

Two threads compete for the exclusive resource based on time efficiency, with the faster thread winning. This yields the final solution.

```go
type RWLock struct {
}

// Solve GetCost using an O(n) read-write lock
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
    // Simplify the problem by using the two randomly initialized points as Pac-Man's starting points
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
	fmt.Println(“Alipay Pac-Man:”)
    fmt.Println(beansA)

    aliyunBeans := make([]model.Bean, 0)
    for _, item := range aliyun.Lines {
        aliyunBeans = append(aliyunBeans, model.Bean{Line: item})
    }
	beansB := aliyun.EatBeans(aliyunBeans)
    fmt.Println(“Alibaba Cloud Pac-Man:”)
    fmt.Println(beansB)

    return end.Sub(start)
}
```

This solution relies on single-threaded time preemption. If using `go routines`, a traditional read-write lock approach would be required, which is beyond the scope of this discussion.

Complete solution available at:
[v1](https://github.com/zeusro/system/tree/main/function/local/n/china/shenzhen/szx/v1)

## Single-Threaded Message Queue Solution

If we treat Alibaba Cloud and Alipay as a unified entity (both belong to Alibaba Group), we can transform the N Pac-Man problem into a single Pac-Man problem. This can be solved using a simple asynchronous message queue:

```go
type Information struct {
    date    time.Time
    content string
}

type AlibabaGroup struct {
    N    int           //Algorithm scale
    Cost time.Duration //Total duration
    model.Alipay
    model.Aliyun
}

func (a *AlibabaGroup) Actor(core string, inbox <-chan Information) {
    for msg := range inbox {
        fmt.Printf(“[%v]Actor %s received[%d]: %s\n”, msg.date, core, a.N, msg.content)
        a.N++
    }
}

// EatBean If we reframe the problem as a unified whole (where Aliyun and Alipay are both assets under Alibaba Group), it simplifies to a basic producer-consumer model
func (ali *AlibabaGroup) EatBean(beans []model.Bean) map[time.Time]model.Point {
	var m map[time.Time]model.Point = make(map[time.Time]model.Point)
    now := time.Now()
    start := now
    // fmt.Println(start)
    n := len(beans)
    var wg sync.WaitGroup
    memory := make(chan Information, 1) // Limit to 1, cast to synchronous queue structure
	wg.Add(1)
    go func() {
        defer wg.Done()
        ali.Actor(“1A84”, memory)
    }()
    a := model.RandonPoint()
    m[now] = a
    memory <- Information{content: “Rise up, Ezaki Pudding!”}
	memory <- Information{date: start, content: fmt.Sprintf(“(%f,%f)”, a.X, a.Y)}
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
        memory <- Information{date: now, content: fmt.Sprintf(“(%f,%f)”, b.X, b.Y)}
    }
    // fmt.Println(now)
	// fmt.Printf(“cost: %v \n”, ali.GetCost())
    ali.Cost = now.Sub(start)
    memory <- Information{date: time.Now(), content: fmt.Sprintf(“cost: %v”, ali.GetCost())}
    close(memory)
    wg.Wait()
    return m
}

func (ali *AlibabaGroup) GetCost() time.Duration {
    return ali.Cost
}
```

Also known as the `Ezaki Pudding` solution.

Full code available at
[v2](https://github.com/zeusro/system/tree/main/function/local/n/china/shenzhen/szx/v2)


Parallel Space-Time Algorithm

Simply put, the Parallel Space-Time Algorithm divides the txy memory space into two identical sections, allowing n threads to operate independently within their own N-dimensional spaces. Finally, it performs deduplication and normalization through a dictionary for merging.

The solution bears some resemblance to the “One-Time Circular Time Preemption Solution Based on Read-Write Locks,” but it involves re-modeling the metadata object and expanding the definition of N-dimensional line segments.

```go
// NLine: Time-based N-dimensional line segment
type NLine struct {
    t       time.Time
    actorID string
    model.Line
}

type Journey struct {
    Lines  []model.Line             // 2D array representation of N-dimensional line segments (omitting time for computational simplicity)
	NBeans map[model.Bean]time.Time // N-dimensional objects
}
```

`Beans` carries N-dimensional line segments.

```go
// Beans structure: built-in concurrent dictionary key->Point
// Directly copied from v1 for zero dependencies, no inheritance used
type Beans struct {
    Name    string
    mu      sync.RWMutex
	items   map[int]model.Point
    FirstNL NLine
}

func (beans *Beans) Thought(n int, date time.Time) *Journey {
    // Simplify problem by treating random initial point as Pac-Man's starting point
    a := make([]model.Point, 1)
    first, _ := beans.GetAndRemove(0)
	journey := NewJourney(n - 1)
    a[0] = first
    // n points can only generate n-1 line segments
    for i := 1; i < n; i++ {
        p, contains := beans.GetAndRemove(i)
        if !contains {
            break
        }
		line := model.NewLine(a[len(a)-1], p)
        // fmt.Printf(“%d:%s\n”, i, line.String())
        date = date.Add(line.Distance())
        journey.AddLine(date, i-1, line)
        if i == 1 {
			line := model.NewLine(a[0], p)
            beans.FirstNL = NLine{t: date, actorID: beans.Name, Line: line}
        }
        // Reset conditions for the next iteration
        a = append(a, p)
    }
    result, err := journey.Validate()
    if !result || err != nil {
		fmt.Println(“Journey validation failed:”, err)
        return journey
    }
    return journey
}
```

The core of the solution is the `DoubleThought` algorithm—by comparing the lengths of each N-dimensional line segment, it eliminates those with longer durations. This ensures that during the final normalization step, the complete N-dimensional line segments are obtained.


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

	start := time.Now()
	journey1 := bean1.Thought(n, start)
	journey2 := bean2.Thought(n, start)
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
		if t2.Equal(t1) {
			fmt.Printf("%v:%v 两个吃豆人同时到达%v，发生碰撞\n", t1, t2, k.Line)
		}
		delete(journey2.NBeans, k)
		line := NLine{t: t1, Line: k.Line, actorID: bean1.Name}
		nLines[t1] = line
		nMap = nMap.Add(t1, line)
		continue
	}
	nMap.AddZero(bean1.FirstNL)
	nMap.AddZero(bean2.FirstNL)
	fmt.Printf("%v : n维线段总数：%d;吃豆人%v总数%v;吃豆人%v总数%v;\n", start,
		len(nMap.items)+2, bean1.Name, len(journey1.NBeans), bean2.Name, len(journey2.NBeans))
	lines := nMap.All(false)
	cost := nMap.GetCost(start)
	fmt.Printf("len(lines):%v cost:%v\n", len(lines), cost)
	for k, v := range lines {
		fmt.Println(v.String(k))
	}
	return lines
}
```

Using 50 points as the algorithm scale, run one test case for analysis.

```go
func TestDoubleThought(t *testing.T) {
    lines := DoubleThought(50)
    t.Logf(“len(lines)：%v”, len(lines))
}
```

The result is as follows:


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

In the `DoubleThought` algorithm, since the initial “Pac-Man” is forcibly assigned two distinct random positions, effectively creating 51 points, the resulting N-dimensional line segments (n points generate n-1 segments) total 50.

```go
p1 := model.RandonPoint()
p2 := model.RandonPoint()
    // Forcibly assign different starting points
	for p1.Compare(p2) {
        p2 = model.RandonPoint()
    }
```

Each run of the program produces random results, with a probability of “operator collision” occurring—meaning n operators simultaneously access the same point at the same moment.

However, the 1st|2nd|nth N-dimensional line segment must share the characteristic of having the same B point:

```bash
0:2025-11-17 08:08:02.411679 +0800 CST m=+0.938456626 aliyun:(298.780000,815.780000)-(672.440000,359.620000)
1:2025-11-17 08:08:02.473679 +0800 CST m=+1.000456626 alipay:(511.320000,964.490000)-(672.440000,359.620000)
2:2025-11-17 08:08:03.396679 +0800 CST m=+1.923456626 alipay:(672.440000,359.620000)-(395.370000,5.850000)
```

 The point `(672.440000,359.620000)` is the timeless fixed point. Regardless of how randomly the program executes or how many random threads exist, these N random threads will inevitably first arrive at the same point.

From the current traditional three-dimensional perspective, this presents a contradiction. The original problem states that the computer's “limited resource” can only be accessed by one thread at a time. However, from an N-dimensional space perspective, this contradiction does not exist.

This is because, according to the characteristics of quantum entanglement states, simultaneous observation cannot determine whether it is one point, two points, or n points.

This is a lock-free multithreading solution designed using time as the key, simultaneously serving as a programmatic interpretation of quantum motion in N-dimensional space.

Complete algorithm available at:
[v3](https://github.com/zeusro/system/tree/main/function/local/n/china/shenzhen/szx)

## Conclusion

```poem
Say goodbye to everyone
Say hello to the new world
```

## References

[1] 
Quantum Mr. & Mrs. Smith (2005 film)(2025)
https://github.com/zeusro/quantum/blob/main/README.md

## Thanks

[『攻殻機動隊 SAC_2045』](（https://www.ghostintheshell-sac2045.jp/）)に感謝