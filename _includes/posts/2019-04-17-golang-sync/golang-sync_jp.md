## 並行関連

### まとめ

| type | 目的 |
|---|---|
| Cond | スタートガン、通常、サブタスクが待機する条件を事前に設定し、信号は単一（Signal）または集団ブロードキャスト（Broadcast）にすることができます |
| Locker | シンプルなインターフェース |
| Mutex | 相互排他ロック |
| Once | 並行実行、1回のみ許可 |
| RWMutex | 読み書きロック、多数の読み取りと少数の書き込み、同時読み取りロック、読み書き相互排他。 |
| WaitGroup | タスクを分散し、メインスレッドがすべてのタスクの完了を待機 |


### Cond 

```go
type Cond
    func NewCond(l Locker) *Cond
    func (c *Cond) Broadcast()
    func (c *Cond) Signal()
    func (c *Cond) Wait()
```

通知リストに追加 -> Lをアンロック -> 通知を待機 -> Lをロック

最初に配置されていますが、このことを理解するのに最も長い時間を費やしました。

私の理解によると、`Cond`はスタートガンのようなものです。たとえば、5匹の犬を同時に飼い、5食分の食べ物を同時に準備しましたが、私の命令なしでは食べさせません。サンプルコードは次のとおりです。


```go

func useCondBroadcast() {
	var count int = 5
	ch := make(chan struct{}, 5)

	// 新しいcondを作成
	var l sync.Mutex
	cond := sync.NewCond(&l)

	for i := 0; i < 5; i++ {
		go func(i int) {
			// 相互排他ロックのロックを競う
			cond.L.Lock()
			// 条件が満たされているか確認
			for count > i {
				cond.Wait()
				fmt.Printf("通知を受信しました goroutine%d\n", i)
			}

			fmt.Printf("goroutine%d 実行終了\n", i)
			cond.L.Unlock()
			ch <- struct{}{}

		}(i)
	}

	// すべてのgoroutineが起動したことを確認
	time.Sleep(time.Millisecond * 20)

	fmt.Println("broadcast...")
	cond.L.Lock()
	count = -1
	cond.Broadcast()
	cond.L.Unlock()

	for i := 0; i < 5; i++ {
		<-ch
	}
}


func useCondSignal() {
	var count int = 5
	ch := make(chan struct{}, 5)

	// 新しいcondを作成
	var l sync.Mutex
	cond := sync.NewCond(&l)

	for i := 0; i < 5; i++ {
		go func(i int) {
			// 相互排他ロックのロックを競う
			cond.L.Lock()
			// 条件が満たされているか確認
			for count > i {
				cond.Wait()
				fmt.Printf("通知を受信しました goroutine%d\n", i)
			}

			fmt.Printf("goroutine%d 実行終了\n", i)
			cond.L.Unlock()
			ch <- struct{}{}

		}(i)
	}

	// すべてのgoroutineが起動したことを確認
	time.Sleep(time.Millisecond * 20)

	time.Sleep(time.Second)
	fmt.Println("signal...")
	cond.L.Lock()
	count = -1
	cond.Signal()
	cond.L.Unlock()

	//fatal error: all goroutines are asleep - deadlock!
	for i := 0; i < 1; i++ {
		<-ch
	}
}

```

この時点で

シナリオ：犬に餌を与える

goroutine：各犬が食べる行為

Broadcast()メソッド：すべての犬に食べることを通知

Signal()メソッド：ランダムな1匹の犬に食べることを通知

例の`count`変数：犬が食べる信号を示す

例の`ch`変数：犬が引っ張るうんち

`useCondBroadcast()`と`useCondSignal`の2つの例の違いは、最後のパイプの読み取りカーソル（i）だけです。

`Broadcast`メソッドはすべての犬に通知するため、すべての犬が正常に食べ始めます（i=4）。

`Signal`は1匹の犬にのみ通知するため、最後に1匹の犬だけがうんちを出します（i=0）

したがって、犬が1匹しかいない場合、`Signal`を使用すると`Broadcast`と同じ効果があります。

`Signal`と`Broadcast`の両方のメソッドは問題ありません。チャネル（ch := make(chan struct{}, 5)）を設定して最終結果を受信する場合、しきい値の変化に注意してください。これは結果の数に影響します。

少なく取るのは問題ありませんが、多すぎると`fatal error: all goroutines are asleep - deadlock!`パニックが発生します（たとえば、`useCondSignal`の例で、`i<1`を`i<2`に変更）、想像を絶する結果になります。

`Cond`の実際の使用ケースについては、`Cond`を最適解に適用するのが最善だと思います。たとえば、同じWebページをクロールする場合、A、B、C、Dの4つのスキームがある可能性があり、そのうちの1つが最も速く完了すれば十分です。その後、1つのタスクが完了するとすぐに、メインスレッドで`Broadcast`が開始されるため、他のスキームは無駄に作業する必要がなく、ステージを退出できます。

`Signal`の実際の使用法はまだ考えていません。機会があれば後で追加します。

`Cond`ロックの競合メカニズムを本当に理解したら、`Broadcast`と`Signal`を交互に使用しても問題はなくなります。

### [Locker](https://golang.org/pkg/sync/#Locker)

単純なインターフェースです。

```go
type Locker interface {
        Lock()
        Unlock()
}
```

### Mutex

```go
type Mutex
    func (m *Mutex) Lock()
    func (m *Mutex) Unlock()
```

相互排他ロック

```go
func useMutex() {
	ch := make(chan struct{}, 2)

	var l sync.Mutex
	go func() {
		l.Lock()
		defer l.Unlock()
		fmt.Println("goroutine1: 約2秒間ロックします")
		time.Sleep(time.Second * 2)
		fmt.Println("goroutine1: ロックを解除しました。取りに行ってください")
		ch <- struct{}{}
	}()

	go func() {
		fmt.Println("groutine2: ロック解除を待機中")
		l.Lock()
		defer l.Unlock()
		fmt.Println("goroutine2: はは、ロックしました")
		ch <- struct{}{}
	}()

	// goroutineの実行終了を待機
	for i := 0; i < 2; i++ {
		<-ch
	}
}
```


### Once

```go
type Once
    func (o *Once) Do(f func())
```    

その名のとおり、OnceのDo関数は1回だけ実行されます。

```go
func useOnce() {
	var once sync.Once
	onceBody := func() {
		fmt.Println("Only once")
	}
	done := make(chan bool)
	for i := 0; i < 10; i++ {
		go func() {
			once.Do(onceBody)
			done <- true
		}()
	}
	for i := 0; i < 10; i++ {
		<-done
	}
}
```

### RWMutex

```go
type RWMutex
    func (rw *RWMutex) Lock()
    func (rw *RWMutex) RLock()
    func (rw *RWMutex) RLocker() Locker
    func (rw *RWMutex) RUnlock()
    func (rw *RWMutex) Unlock()
```    

RWMutexはMutexに基づいて実装されています。

読み書きロック、一般的に大量の読み取り操作と少数の書き込み操作のシナリオで使用されます。

1. 同時に1つのgoroutineのみが書き込みロックを取得できます。
1. 任意の数のgoroutineが同時に読み取りロックを取得できます。
1. 書き込みロックまたは読み取りロックのみが同時に存在できます（読み取りと書き込みは相互排他的）。

```go
func useRWMutex() {
	ch := make(chan struct{}, 10)
	for i := 0; i < 5; i++ {
		go read(i, ch)
	}
	for i := 0; i < 5; i++ {
		go write(i, ch)
	}

	for i := 0; i < 10; i++ {
		<-ch
	}
}

var count int
var rw sync.RWMutex

func read(n int, ch chan struct{}) {
	rw.RLock()
	fmt.Printf("goroutine %d 読み取り操作に入っています...\n", n)
	v := count
	fmt.Printf("goroutine %d 読み取り終了、値は：%d\n", n, v)
	rw.RUnlock()
	ch <- struct{}{}
}

func write(n int, ch chan struct{}) {
	rw.Lock()
	fmt.Printf("goroutine %d 書き込み操作に入っています...\n", n)
	v := rand.Intn(1000)
	count = v
	fmt.Printf("goroutine %d 書き込み終了、新しい値は：%d\n", n, v)
	rw.Unlock()
	ch <- struct{}{}
}
```

### WaitGroup

```go
type WaitGroup
    func (wg *WaitGroup) Add(delta int)
    func (wg *WaitGroup) Done()
    func (wg *WaitGroup) Wait()
Examples(Expand All)

```

シンプルなマルチタスク分散

```go
func useWaitGroup() {
	// syncパッケージのWaitGroupを使用して並行制御を実現

	var wg sync.WaitGroup

	wg.Add(1)
	go func(wg *sync.WaitGroup) {
		time.Sleep(5 * time.Second)
		fmt.Println("1 done")
		wg.Done()
	}(&wg)

	wg.Add(1)
	go func(wg *sync.WaitGroup) {
		time.Sleep(9 * time.Second)
		fmt.Println("2 done")
		wg.Done()
	}(&wg)
	wg.Wait()
	fmt.Println("handle2 done")

	// syncパッケージはWaitGroupを提供し、収集したすべてのgoroutineタスクが完了するのを待機します。メインgoroutineでは、Add(delta int)を使用して待機するgoroutineの数を指定します。各goroutineが完了すると、Done()はこのgoroutineが完了したことを示します。すべてのgoroutineが完了すると、WaitGroupはメインgoroutineで返されます。
}
```

## データ構造

### Map

```go
type Map
    func (m *Map) Delete(key interface{})
    func (m *Map) Load(key interface{}) (value interface{}, ok bool)
    func (m *Map) LoadOrStore(key, value interface{}) (actual interface{}, loaded bool)
    func (m *Map) Range(f func(key, value interface{}) bool)
    func (m *Map) Store(key, value interface{})
```    

#### 適用シナリオ

スレッドセーフなコレクション、2つのシナリオで最適化：

1. 1回書き込み、複数回読み取り
2. 複数のgoroutineが異なるキーを読み書き（たとえば、goroutine1がkey1を読み書き、goroutine2がkey2を読み書き）

#### メソッドの紹介

Load：読み取り
LoadOrStore：読み取り、見つからない場合は書き込み
Store：書き込み
Range：直接反復できない、コールバック方式で反復する必要がある

具体的な使用方法は以下を参照：
[Go 1.9 sync.Map揭秘](https://colobu.com/2017/07/11/dive-into-sync-Map/)

### Pool

```go
type Pool
    func (p *Pool) Get() interface{}
    func (p *Pool) Put(x interface{})
```    

```go

var bufPool = sync.Pool{
	New: func() interface{} {
		return new(bytes.Buffer)
	},
}

func usePool(key, val string) {
	// 一時オブジェクトを取得、利用できない場合は自動的に作成
	b := bufPool.Get().(*bytes.Buffer)
	b.Reset()
	b.WriteString(key)
	b.WriteByte('=')
	b.WriteString(val)
	os.Stdout.Write(b.Bytes())
	// 一時オブジェクトをPoolに戻す
	bufPool.Put(b)
}
```


## 参考リンク：

1. [Golang syncパッケージの関連使用方法について](https://deepzz.com/post/golang-sync-package-usage.html)
2. [mapパフォーマンス比較](https://medium.com/@deckarep/the-new-kid-in-town-gos-sync-map-de24a6bf7c2c)
