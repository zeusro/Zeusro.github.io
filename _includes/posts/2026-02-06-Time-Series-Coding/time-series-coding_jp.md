時間序列ライブラリの元論文（[http://github.com/zeusro/data](http://github.com/zeusro/data)）は失われており、限られた記憶から時間序列の部分を少しずつ再構成するしかない。

時間をかけた実践によってのみ、プログラムの正しさは検証できる。そこで時間序列メタプログラミングモデルを提唱する。現実世界をモデル化するための新しいプログラムのパラダイムであり、プログラミング言語に依存しない設計哲学である。

この上に**時間序列複雑度**を導入する：従来の時間・空間複雑度を満たすことを前提に、二次元グラフ（t とメモリ利用率など）や三次元グラフ（CPU/GPU 負荷を加える）で、アルゴリズムの実際の実行時間とリソース利用を表現する。

## 時間序列

**時間序列**：時間順に並べられた、同一対象の状態の時間変化を記録したデータの集合。  
時間序列の API は `Watch` のみである。`Watch` は順序に従って `Read` と `Write` インターフェースに分化できる。

## 時間序列オブジェクト

時間序列オブジェクトでは、時間を第一メンバーとし、初期化関数に反映させる必要がある。  
時間に基づいて生成されるデータはすべて時系列データである。

```go
type DeadMonkey struct {
	Birth       time.Time
	GoldenStaff []NLine // 金箍棒 パラメトリック線分（Parametric Segment）
	m           int     // 消費者規模
	n           int     // アルゴリズム規模
	ZeroPoints  []model.Point
	cost        time.Duration
}
```

## 時間序列関数

時間序列関数では、時間を第一引数とする。戻り値の第一メンバーは時間序列オブジェクトでなければならない。  
入力される時間と出力される時間は、関数の時間の下界と上界を表す。

```go
// NewDeadMonkey
// m 戦闘対象
// n 唯一リソース数 / アルゴリズム規模
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
		// 前の点と重複しなければよい。全体での重複は無視する
		for p1.Compare(zeroPoints[i-1]) {
			p1 = model.RandonPoint()
		}
		zeroPoints[i] = p1
	}
	dead.ZeroPoints = zeroPoints
	return &dead
}

// SleepAndReturnNewTime 時間引数を受け取り、ランダムに sleep してから最新の時間を返す
func SleepAndReturnNewTime(inputTime time.Time) time.Time {
    // 乱数シードを設定
    rand.Seed(time.Now().UnixNano())

    // 1〜5秒のランダムな sleep 時間を生成
    sleepDuration := time.Duration(rand.Intn(5)+1) * time.Second

    // ランダム時間だけ Sleep
    time.Sleep(sleepDuration)

    // 現在時刻を返す
    return time.Now()
}
```

## 時間序列距離

時間＋その他の条件による複合判定を用いる（例：4次元球面上では距離のみで換算してもよいし、時間＋Haversine 公式で換算してもよい）。

## 時間序列ログ

出力内容は「時間＋内容」の形式でなければならない。

## 時間序列複雑度

時間序列複雑度（Time Series Complexity）：時間複雑度および空間複雑度の前提を満たした上で、アルゴリズムの実際の実行時間とメモリリソースの利用効率。

時間序列複雑度は二次元グラフで表す。X 軸は t、Y 軸は `(used - buff/cache) / total`。

Y 軸は必要に応じて、CPU/GPU の全体利用率など別の指標を用いてよい。

単位時間序列複雑度は三次元グラフである。三次元は抽象的すぎるため、2 つの二次元グラフに次元削減するか、Y 軸を統合して二次元グラフ上の 2 本の曲線にしてもよい。

**単位 CPU 時間序列複雑度**は三次元グラフである。X 軸は t、Y 軸は (used - buff/cache) / total、Z 軸は cpu_load1。

**単位 GPU 時間序列複雑度**は三次元グラフである。X 軸は t、Y 軸は (used - buff/cache) / total、Z 軸は gpu_utilization。

時間序列複雑度にはプログラムの可観測性解析が必要である。

## 時間序列空間

時間序列からなる 2 次元以上の空間。

OOOS（[https://github.com/zeusro/system](https://github.com/zeusro/system)）では、このプログラミングパラダイムを可能な限り用いる。

例：
- 制約付きリソースへの無ロック並行アクセスの並行時空アルゴリズム（[https://github.com/zeusro/system/blob/main/function/local/n/china/shenzhen/szx/readme.md](https://github.com/zeusro/system/blob/main/function/local/n/china/shenzhen/szx/readme.md)）
- Y 関数（[https://github.com/zeusro/system/blob/main/function/local/n/china/shantou/y/y.go#L73](https://github.com/zeusro/system/blob/main/function/local/n/china/shantou/y/y.go#L73)）
