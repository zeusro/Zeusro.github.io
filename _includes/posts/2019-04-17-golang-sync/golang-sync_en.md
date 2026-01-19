## Concurrency Related

### Summary

| type | purpose |
|---|---|
| Cond | Starting gun, usually pre-sets a condition for subtasks to wait; the signal can be single (Signal) or broadcast (Broadcast) |
| Locker | Simple interface |
| Mutex | Mutual exclusion lock |
| Once | Concurrent execution, only allowed once |
| RWMutex | Read-write lock, many reads and few writes, simultaneous read locks, read-write mutual exclusion. |
| WaitGroup | Distribute tasks, main thread waits for all tasks to complete |


### Cond 

```go
type Cond
    func NewCond(l Locker) *Cond
    func (c *Cond) Broadcast()
    func (c *Cond) Signal()
    func (c *Cond) Wait()
```

Add to notification list -> Unlock L -> Wait for notification -> Lock L

Although it's placed at the very beginning, I spent the longest time trying to understand this thing.

According to my understanding, `Cond` is like a starting gun. For example, I have 5 dogs and 5 portions of food ready at the same time, but I won't let them eat without my command. The example code is as follows:


```go

func useCondBroadcast() {
	var count int = 5
	ch := make(chan struct{}, 5)

	// Create new cond
	var l sync.Mutex
	cond := sync.NewCond(&l)

	for i := 0; i < 5; i++ {
		go func(i int) {
			// Compete for mutual exclusion lock
			cond.L.Lock()
			// Check if condition is met
			for count > i {
				cond.Wait()
				fmt.Printf("Received a notification goroutine%d\n", i)
			}

			fmt.Printf("goroutine%d execution finished\n", i)
			cond.L.Unlock()
			ch <- struct{}{}

		}(i)
	}

	// Ensure all goroutines have started
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

	// Create new cond
	var l sync.Mutex
	cond := sync.NewCond(&l)

	for i := 0; i < 5; i++ {
		go func(i int) {
			// Compete for mutual exclusion lock
			cond.L.Lock()
			// Check if condition is met
			for count > i {
				cond.Wait()
				fmt.Printf("Received a notification goroutine%d\n", i)
			}

			fmt.Printf("goroutine%d execution finished\n", i)
			cond.L.Unlock()
			ch <- struct{}{}

		}(i)
	}

	// Ensure all goroutines have started
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

At this point

Scenario: Feeding dogs

goroutine: The act of each dog eating

Broadcast() method: Notify all dogs to eat

Signal() method: Notify a random dog to eat

`count` variable in the example: Indicates the signal for dogs to eat

`ch` variable in the example: The poop the dogs pull

The difference between `useCondBroadcast()` and `useCondSignal` examples is only in the final pipe's read cursor (i).

The `Broadcast` method notifies all dogs, so all dogs successfully start eating (i=4).

`Signal` only notifies one dog, so only one dog poops in the end (i=0).

So if there is only one dog, using `Signal` has the same effect as `Broadcast`.

Both `Signal` and `Broadcast` methods are fine. If a channel (ch := make(chan struct{}, 5)) is set up to receive the final result, be careful about the change in the threshold value, which affects the number of results.

It's okay to take fewer, but taking too many will cause a `fatal error: all goroutines are asleep - deadlock!` panic (e.g., in the `useCondSignal` example, change `i<1` to `i<2`), with unimaginable consequences.

Regarding the actual use case of `Cond`, I think `Cond` is best applied to an optimal solution. For example, if I want to crawl the same webpage, there might be four schemes A, B, C, D, and I only need one of them to finish the fastest. Then, as soon as one task completes, `Broadcast` is initiated in the main thread, so other schemes don't have to work in vain and can exit the stage.

I haven't thought of an actual use for `Signal` yet; I'll add it later if I have a chance.

Once the contention mechanism of `Cond` lock is truly understood, alternating `Broadcast` and `Signal` no longer poses any problem.

### [Locker](https://golang.org/pkg/sync/#Locker)

Just a simple interface.

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

Mutual exclusion lock

```go
func useMutex() {
	ch := make(chan struct{}, 2)

	var l sync.Mutex
	go func() {
		l.Lock()
		defer l.Unlock()
		fmt.Println("goroutine1: I will lock for about 2s")
		time.Sleep(time.Second * 2)
		fmt.Println("goroutine1: I unlocked, go grab it")
		ch <- struct{}{}
	}()

	go func() {
		fmt.Println("groutine2: Waiting for unlock")
		l.Lock()
		defer l.Unlock()
		fmt.Println("goroutine2: Haha, I locked it")
		ch <- struct{}{}
	}()

	// Wait for goroutines to finish
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

As its name suggests, the Do function in Once will only run once.

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

RWMutex is implemented based on Mutex.

Read-write lock, generally used in scenarios with a large number of read operations and a small number of write operations.

1. Only one goroutine can acquire a write lock at a time.
1. Any number of goroutines can acquire read locks simultaneously.
1. Only a write lock or read lock can exist simultaneously (read and write are mutually exclusive).

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
	fmt.Printf("goroutine %d entering read operation...\n", n)
	v := count
	fmt.Printf("goroutine %d finished reading, value is: %d\n", n, v)
	rw.RUnlock()
	ch <- struct{}{}
}

func write(n int, ch chan struct{}) {
	rw.Lock()
	fmt.Printf("goroutine %d entering write operation...\n", n)
	v := rand.Intn(1000)
	count = v
	fmt.Printf("goroutine %d finished writing, new value is: %d\n", n, v)
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

Simple multi-task distribution

```go
func useWaitGroup() {
	// Achieve concurrency control through WaitGroup in the sync package

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

	// The sync package provides WaitGroup, which waits for all goroutine tasks it collects to complete. In the main goroutine, Add(delta int) is used to specify the number of goroutines to wait for. After each goroutine completes, Done() indicates that this goroutine is finished. When all goroutines are completed, WaitGroup returns in the main goroutine.
}
```

## Data Structures

### Map

```go
type Map
    func (m *Map) Delete(key interface{})
    func (m *Map) Load(key interface{}) (value interface{}, ok bool)
    func (m *Map) LoadOrStore(key, value interface{}) (actual interface{}, loaded bool)
    func (m *Map) Range(f func(key, value interface{}) bool)
    func (m *Map) Store(key, value interface{})
```    

#### Applicable Scenarios

Thread-safe collection, optimized for 2 scenarios:

1. Write once, read many times
2. Multiple goroutines read and write different keys (e.g., goroutine1 reads/writes key1, goroutine2 reads/writes key2)

#### Method Introduction

Load: Read
LoadOrStore: Read, if not found, then write
Store: Write
Range: Cannot iterate directly, must iterate through callback

Specific usage can be found in:
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
	// Get temporary object, automatically create if not available
	b := bufPool.Get().(*bytes.Buffer)
	b.Reset()
	b.WriteString(key)
	b.WriteByte('=')
	b.WriteString(val)
	os.Stdout.Write(b.Bytes())
	// Return temporary object to Pool
	bufPool.Put(b)
}
```


## Reference Links:

1. [浅谈 Golang sync 包的相关使用方法](https://deepzz.com/post/golang-sync-package-usage.html)
2. [map性能对比](https://medium.com/@deckarep/the-new-kid-in-town-gos-sync-map-de24a6bf7c2c)
