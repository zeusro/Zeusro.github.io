<!-- TODO: Translate to en -->

## 并发相关

### 总结


type | 作用
---|---
Cond|发令枪,一般预设一个条件让子任务等待,发出的信号可以是单个(Signal)也可集体广播(Broadcast)
Locker|简单接口
Mutex|互斥锁
Once|并发运行,只允许一次
RWMutex|读写锁,多读少写,同时读锁,读写互斥.
WaitGroup|分发任务,主线程等待所有任务完成


### Cond 

```go
type Cond
    func NewCond(l Locker) *Cond
    func (c *Cond) Broadcast()
    func (c *Cond) Signal()
    func (c *Cond) Wait()
```

加入到通知列表 -> 解锁 L -> 等待通知 -> 锁定 L

虽然放在最前面,但我花了最长的时间去理解这玩意.

按照我的理解,`Cond`就好比一个发令枪.比如我同时养了5条狗,并同时准备了5份食物,但是没有我的口令,我不准它们吃.示例代码如下:


```go

func useCondBroadcast() {
	var count int = 5
	ch := make(chan struct{}, 5)

	// 新建 cond
	var l sync.Mutex
	cond := sync.NewCond(&l)

	for i := 0; i < 5; i++ {
		go func(i int) {
			// 争抢互斥锁的锁定
			cond.L.Lock()
			// 条件是否达成
			for count > i {
				cond.Wait()
				fmt.Printf("收到一个通知 goroutine%d\n", i)
			}

			fmt.Printf("goroutine%d 执行结束\n", i)
			cond.L.Unlock()
			ch <- struct{}{}

		}(i)
	}

	// 确保所有 goroutine 启动完成
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

	// 新建 cond
	var l sync.Mutex
	cond := sync.NewCond(&l)

	for i := 0; i < 5; i++ {
		go func(i int) {
			// 争抢互斥锁的锁定
			cond.L.Lock()
			// 条件是否达成
			for count > i {
				cond.Wait()
				fmt.Printf("收到一个通知 goroutine%d\n", i)
			}

			fmt.Printf("goroutine%d 执行结束\n", i)
			cond.L.Unlock()
			ch <- struct{}{}

		}(i)
	}

	// 确保所有 goroutine 启动完成
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

这时

场景:喂狗

goroutine:每一条狗吃饭的行为

Broadcast()方法:通知所有狗吃饭

Signal()方法:通知随机一条狗吃饭

例子中count变量: 指示狗吃饭的信号

例子中的ch变量:狗拉的便便

`useCondBroadcast()`和`useCondSignal`这2个例子,差别只在于最后管道的读取游标(i).

`Broadcast`方法通知的对象是所有的狗,所以最后所有的狗都顺利开吃(i=4).

`Signal`只通知了一条狗,所以最后只有一条狗拉出了便便(i=0)

所以如果只有一条狗,那么使用`Signal`效果等同于`Broadcast`.

用`Signal`和`Broadcast`方法都好,如果设置了管道(ch := make(chan struct{}, 5))去接收最后的结果,要注意设置的临界值变化导致的最后出来的结果数量.

取少了没关系,取多了会出现`fatal error: all goroutines are asleep - deadlock!`这个`panic`(比如,在`useCondSignal`这个例子里面,把`i<1`改成`i<2`),后果不堪设想.

关于`Cond`实际的使用场景,我觉得把`Cond`应用于最优解.比如说我要爬取同一个网页,可能有ABCD四种方案,我只需要其中一个方案最快完成即可.那么只要其中一个任务完成,在主线程发起`Broadcast`,这样其他方案就不用白忙活了,可以退出舞台.

暂时没想到`Signal`的实际用法,以后有机会再补充吧.

真正理解了`Cond`锁的争抢方式之后,`Broadcast`和`Signal`交替使用也就不再有什么问题.

### [Locker](https://golang.org/pkg/sync/#Locker)

只是一个简单的接口.

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

互斥锁

```go
func useMutex() {
	ch := make(chan struct{}, 2)

	var l sync.Mutex
	go func() {
		l.Lock()
		defer l.Unlock()
		fmt.Println("goroutine1: 我会锁定大概 2s")
		time.Sleep(time.Second * 2)
		fmt.Println("goroutine1: 我解锁了，你们去抢吧")
		ch <- struct{}{}
	}()

	go func() {
		fmt.Println("groutine2: 等待解锁")
		l.Lock()
		defer l.Unlock()
		fmt.Println("goroutine2: 哈哈，我锁定了")
		ch <- struct{}{}
	}()

	// 等待 goroutine 执行结束
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

如其名,Once里的Do函数只会运行一次

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

RWMutex是基于Mutex实现的.

读写锁,一般用在大量读操作、少量写操作的情况

1. 同时只能有一个 goroutine 能够获得写锁定。
1. 同时可以有任意多个 gorouinte 获得读锁定。
1. 同时只能存在写锁定或读锁定（读和写互斥）。

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
	fmt.Printf("goroutine %d 进入读操作...\n", n)
	v := count
	fmt.Printf("goroutine %d 读取结束，值为：%d\n", n, v)
	rw.RUnlock()
	ch <- struct{}{}
}

func write(n int, ch chan struct{}) {
	rw.Lock()
	fmt.Printf("goroutine %d 进入写操作...\n", n)
	v := rand.Intn(1000)
	count = v
	fmt.Printf("goroutine %d 写入结束，新值为：%d\n", n, v)
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

简单的多任务分发

```go
func useWaitGroup() {
	// 通过sync包中的WaitGroup 实现并发控制

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

	// 在 sync 包中，提供了 WaitGroup ，它会等待它收集的所有 goroutine 任务全部完成，在主 goroutine 中 Add(delta int) 索要等待goroutine 的数量。在每一个 goroutine 完成后 Done() 表示这一个goroutine 已经完成，当所有的 goroutine 都完成后，在主 goroutine 中 WaitGroup 返回。
}
```

## 数据结构

### Map

```go
type Map
    func (m *Map) Delete(key interface{})
    func (m *Map) Load(key interface{}) (value interface{}, ok bool)
    func (m *Map) LoadOrStore(key, value interface{}) (actual interface{}, loaded bool)
    func (m *Map) Range(f func(key, value interface{}) bool)
    func (m *Map) Store(key, value interface{})
```    

#### 适用场景

线程安全集合,在2个场景做了优化

1. 只写1次,多次读
2. 多个goroutines读写互不相同的键(比如goroutines1读写key1,goroutines2读写key2)

#### 方法介绍

Load 读取

LoadOrStore 读取不到则写入

Store 写入

Range 无法直接遍历,得通过回调的方式遍历

具体用法见

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
	// 获取临时对象，没有的话会自动创建
	b := bufPool.Get().(*bytes.Buffer)
	b.Reset()
	b.WriteString(key)
	b.WriteByte('=')
	b.WriteString(val)
	os.Stdout.Write(b.Bytes())
	// 将临时对象放回到 Pool 中
	bufPool.Put(b)
}
```


## 参考链接:

1. [浅谈 Golang sync 包的相关使用方法](https://deepzz.com/post/golang-sync-package-usage.html)
2. [map性能对比](https://medium.com/@deckarep/the-new-kid-in-town-gos-sync-map-de24a6bf7c2c)