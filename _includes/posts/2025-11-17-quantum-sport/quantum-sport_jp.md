## はじめに

2025-05-03に深圳空港に到着した後、空港の廊橋から外まで、全てAlipayとAlibaba Cloudの広告で埋め尽くされていることに気づきました。
これで思い出したのは、かつての「Pac-Man」ゲームです：xy空間で2人のプレイヤーが自分のPac-Manを操作し、xy空間中の全ての豆を食べ尽くす必要がありました。

簡単に言えば、これはPac-Man問題です：「N個のPac-Manができるだけロックなしで全ての豆（各豆は一度だけ食べられる）を食べるにはどうすればよいか？」
しかし、このシナリオをプログラム的に抽象モデリングすると、ちょうどtxy空間で2つのスレッドがどのようにロックなしで一度きりのリソースにアクセスするかという問題にもなります。

歴史的なこの問題の解法を参考にしつつ、私も3つのバージョンのプログラムとコードを考案しました。そして第3のバージョンでは、Parallel Spacetime Algorithm（平行時空アルゴリズム）によって「量子がN次元空間で運動する」ことをシミュレートしました。

## 形式論理と定義

量子：物理システムにおけるある物理量（エネルギー、角運動量、電荷など）が取りうる最も基本的で不可分な離散単位。

算子：ある関数空間またはベクトル空間上の写像。

N次元空間：時間を第1軸とするN次元空間。例えばtxは（時系列）2次元空間、txyは（時系列）3次元空間、txyzは（時系列）4次元空間。

<img src="/img/pay.png" alt="pay" style="width:40%; height:auto; display:block;">

平行時空アルゴリズム：複数のメモリ空間を割り当て、平行に複数のN次元空間を構築し、それぞれの算子/量子が各自のN次元空間で運動し、最後に時間をキーとして収束させ、並列スレッドがロックなしで一度きりのリソースにアクセスする解法。
この解法を私は平行時空アルゴリズムと呼びます。

算子の衝突：2つの算子が同じ時刻に接触すること。「Pac-Man」を例にすると、算子の衝突とは2つのPac-Manが同時に制限付きリソースへアクセスすることを指します。

時系列不動点：角谷不動点の（非）ユークリッド空間における一般化。ユークリッド空間には「意識」の定義が含まれないため、角谷不動点は実は時系列不動点の特殊ケースです。時系列不動点は、実際の必要に応じて次元を落として角谷不動点とすることができます。具体的にはシナリオに応じて説明されます。

点：`golang struct`を使って実装された直交座標系の2次元構造体。

```go
// Define point structure
type Point struct {
    X float64
    Y float64
}
```

線分：`golang struct`を使って実装された構造体。

```go
// Define line segment structure
type Line struct {
    A Point
    B Point
}
```

線分の長さ：ランダムな時間をN次元線分の長さの唯一の基準とする。

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

## 読み書きロックに基づく一回限りループ時間プリエンプション解法

もしマップ上の全ての豆を排他的リソースとみなすなら、シリアル番号をキー、マップ上の点を値として、読み書きロックに基づく辞書を構築できます：

 ```go
 // Beans structure: built-in concurrent dictionary key->Point
type Beans struct {
    mu    sync.RWMutex
    items map[int]model.Point
}
```

2つのスレッドが、時間の速さに基づいて排他的リソースを争奪し、必要な時間が短い方が勝ちとなり、最終的な答えが得られます。

```go
type RWLock struct {
}

// GetCost solves the problem using O(n) read-write lock
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
    // Simplify the problem by using two random initial points as the starting points for Pac-Man
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

ここでの解法は、単一スレッドの時間プリエンプションに基づいています。`go routine`を使う場合、従来の読み書きロック方式の解法を実装する必要がありますが、ここでは割愛します。

完全な解法は下記参照：
 [v1](https://github.com/zeusro/system/tree/main/function/local/n/china/shenzhen/szx/v1)

## 単一スレッドメッセージキュー解法

もしAlibaba CloudとAlipayを一つの全体（どちらもAlibaba Groupの傘下）とみなすなら、N個のPac-Man問題を1個のPac-Man問題に変換でき、シンプルな非同期メッセージキューで解くことができます：

```go
type Information struct {
    date    time.Time
    content string
}

type AlibabaGroup struct {
    N    int           // algorithm scale
    Cost time.Duration // total time cost
    model.Alipay
    model.Aliyun
}

func (a *AlibabaGroup) Actor(core string, inbox <-chan Information) {
    for msg := range inbox {
        fmt.Printf("[%v]Actor %s received[%d]: %s\n", msg.date, core, a.N, msg.content)
        a.N++
    }
}

// EatBean If the problem is converted into a whole (Aliyun and Alipay are both assets of Alibaba Group), the problem can be simplified as a simple producer-consumer model
func (ali *AlibabaGroup) EatBean(beans []model.Bean) map[time.Time]model.Point {
    var m map[time.Time]model.Point = make(map[time.Time]model.Point)
    now := time.Now()
    start := now
    // fmt.Println(start)
    n := len(beans)
    var wg sync.WaitGroup
    memory := make(chan Information, 1) // limit to 1, forcibly convert to synchronous queue structure
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

この方法は「江崎プリン」解法とも呼べます。

完全なコードは下記参照
[v2](https://github.com/zeusro/system/tree/main/function/local/n/china/shenzhen/szx/v2)

## 平行時空アルゴリズム

平行時空アルゴリズムとは、簡単に言えば、2つの同じtxyメモリ空間を分割し、n個のスレッドがそれぞれ自分のN次元空間で運動し、最後に辞書で重複を排除し、正規化して統合する方法です。

この解法は「読み書きロックに基づく一回限りループ時間プリエンプション解法」と似ていますが、メタデータオブジェクトを再設計し、N次元線分の定義を拡張しています。

```go
// NLine: n-dimensional line segment based on time
type NLine struct {
    t       time.Time
    actorID string
    model.Line
}

type Journey struct {
    Lines  []model.Line             // n-dimensional line segments (for simplicity, time is not introduced) as a 2D line segment array
    NBeans map[model.Bean]time.Time // n-dimensional objects
}
```

`Beans`の中でN次元線分を保持します。

```go
// Beans structure: built-in concurrent dictionary key->Point
// To avoid dependencies, directly copy from v1 version, do not use inheritance
type Beans struct {
    Name    string
    mu      sync.RWMutex
    items   map[int]model.Point
    FirstNL NLine
}

func (beans *Beans) Thought(n int, date time.Time) *Journey {
    // Simplify the problem by using a random initial point as the starting point for Pac-Man
    a := make([]model.Point, 1)
    first, _ := beans.GetAndRemove(0)
    journey := NewJourney(n - 1)
    a[0] = first
    // n points can only form n-1 line segments
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
        // Reset condition for the next round
        a = append(a, p)
    }
    result, err := journey.Validate()
    if !result || err != nil {
        fmt.Println("Journey validation failed:", err)
        return journey
    }
    return journey
}
```

解法のコアは `DoubleThought` アルゴリズムです——各N次元線分の長さを比較し、より時間がかかるN次元線分を除外することで、最終的な正規化時に完全なN次元線分を得ることができます。

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

50個の点をアルゴリズムの規模として、テストケースを一度実行して分析します。

```go
func TestDoubleThought(t *testing.T) {
    lines := DoubleThought(50)
    t.Logf("len(lines): %v", len(lines))
}
```

結果は以下の通りです：

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

`DoubleThought` アルゴリズムでは、初期の「Pac-Man」に2つの異なるランダムな位置を強制的に割り当てるため、実質的に51個の点があり、最終的に生成されるN次元線分（n個の点からn-1本の線分が生成される）は50本となります。

```go
p1 := model.RandonPoint()
p2 := model.RandonPoint()
    // Force assignment of different starting points
    for p1.Compare(p2) {
        p2 = model.RandonPoint()
    }
```

プログラムの実行結果は毎回ランダムであり、「算子の衝突」——すなわち同時にn個の算子が同じ点にアクセスする現象が発生する可能性があります。

しかし、第1|2|n本目のN次元線分は必ずB点が同じという特徴に合致します：

```bash
0:2025-11-17 08:08:02.411679 +0800 CST m=+0.938456626 aliyun:(298.780000,815.780000)-(672.440000,359.620000)
1:2025-11-17 08:08:02.473679 +0800 CST m=+1.000456626 alipay:(511.320000,964.490000)-(672.440000,359.620000)
2:2025-11-17 08:08:03.396679 +0800 CST m=+1.923456626 alipay:(672.440000,359.620000)-(395.370000,5.850000)
```

 `(672.440000,359.620000)`この点が時系列不動点です。なぜなら、プログラムがどれだけランダムに実行されても、ランダムスレッドがいくつあっても、これらN個のランダムスレッドが最初に到達するのは必ず同じ点だからです。

現在の伝統的な三次元の観点から見ると、これは矛盾に見えます。なぜなら、元の問題はコンピュータの「制限付きリソース」であり、毎回1つのスレッドしかアクセスできないからです。しかしN次元空間の観点から見ると、これは矛盾しません。

なぜなら、量子エンタングルメントの特徴に従えば、同時観測では1点なのか2点なのかn点なのか確定できないからです。

これは時間をキーとしたロックなしマルチスレッド解決法であると同時に、N次元空間における量子運動のプログラム的解釈でもあります。

完全なアルゴリズムは下記参照：
[v3](https://github.com/zeusro/system/tree/main/function/local/n/china/shenzhen/szx)

## 結論

殊途同歸終須別，時來運去皆無常

## 参考文献

[1] 
運動の量子化解釈(2025)
https://github.com/zeusro/quantum/blob/main/README.zh.md

## 公開済み・投稿予定論文

1. Zeusro（2025）時間は物質と意識を超越する第一の次元 https://github.com/zeusro/quantum/blob/main/t.zh.md
1. Zeusro（2025）運動の量子化解釈 https://github.com/zeusro/quantum/blob/main/README.zh.md

## 謝辞

[『攻殻機動隊 SAC_2045』](（https://www.ghostintheshell-sac2045.jp/）)に感謝
