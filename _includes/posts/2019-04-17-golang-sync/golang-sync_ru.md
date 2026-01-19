## Связанное с параллелизмом

### Резюме

| type | назначение |
|---|---|
| Cond | Стартовый пистолет, обычно предустанавливает условие для подзадач ожидания; сигнал может быть одиночным (Signal) или широковещательным (Broadcast) |
| Locker | Простой интерфейс |
| Mutex | Взаимоисключающая блокировка |
| Once | Параллельное выполнение, разрешено только один раз |
| RWMutex | Блокировка чтения-записи, много чтений и мало записей, одновременные блокировки чтения, взаимное исключение чтения-записи. |
| WaitGroup | Распределение задач, главный поток ждет завершения всех задач |


### Cond 

```go
type Cond
    func NewCond(l Locker) *Cond
    func (c *Cond) Broadcast()
    func (c *Cond) Signal()
    func (c *Cond) Wait()
```

Добавить в список уведомлений -> Разблокировать L -> Ждать уведомления -> Заблокировать L

Хотя это помещено в самом начале, я потратил больше всего времени, пытаясь понять эту вещь.

Согласно моему пониманию, `Cond` похож на стартовый пистолет. Например, у меня есть 5 собак и 5 порций еды, готовых одновременно, но я не позволю им есть без моей команды. Примерный код выглядит следующим образом:


```go

func useCondBroadcast() {
	var count int = 5
	ch := make(chan struct{}, 5)

	// Создать новый cond
	var l sync.Mutex
	cond := sync.NewCond(&l)

	for i := 0; i < 5; i++ {
		go func(i int) {
			// Конкурировать за блокировку взаимного исключения
			cond.L.Lock()
			// Проверить, выполнено ли условие
			for count > i {
				cond.Wait()
				fmt.Printf("Получено уведомление goroutine%d\n", i)
			}

			fmt.Printf("goroutine%d выполнение завершено\n", i)
			cond.L.Unlock()
			ch <- struct{}{}

		}(i)
	}

	// Убедиться, что все goroutines запущены
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

	// Создать новый cond
	var l sync.Mutex
	cond := sync.NewCond(&l)

	for i := 0; i < 5; i++ {
		go func(i int) {
			// Конкурировать за блокировку взаимного исключения
			cond.L.Lock()
			// Проверить, выполнено ли условие
			for count > i {
				cond.Wait()
				fmt.Printf("Получено уведомление goroutine%d\n", i)
			}

			fmt.Printf("goroutine%d выполнение завершено\n", i)
			cond.L.Unlock()
			ch <- struct{}{}

		}(i)
	}

	// Убедиться, что все goroutines запущены
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

В этот момент

Сценарий: Кормление собак

goroutine: Действие каждой собаки, поедающей еду

Метод Broadcast(): Уведомить всех собак поесть

Метод Signal(): Уведомить случайную собаку поесть

Переменная `count` в примере: Указывает сигнал для собак поесть

Переменная `ch` в примере: Какашки, которые тянут собаки

Разница между примерами `useCondBroadcast()` и `useCondSignal` только в курсоре чтения финальной трубы (i).

Метод `Broadcast` уведомляет всех собак, поэтому все собаки успешно начинают есть (i=4).

`Signal` уведомляет только одну собаку, поэтому в конце только одна собака какает (i=0).

Так что если есть только одна собака, использование `Signal` имеет тот же эффект, что и `Broadcast`.

Оба метода `Signal` и `Broadcast` хороши. Если настроен канал (ch := make(chan struct{}, 5)) для получения финального результата, будьте осторожны с изменением порогового значения, которое влияет на количество результатов.

Можно взять меньше, но взять слишком много вызовет панику `fatal error: all goroutines are asleep - deadlock!` (например, в примере `useCondSignal` изменить `i<1` на `i<2`), с непредсказуемыми последствиями.

Что касается фактического случая использования `Cond`, я думаю, что `Cond` лучше всего применять к оптимальному решению. Например, если я хочу сканировать одну и ту же веб-страницу, могут быть четыре схемы A, B, C, D, и мне нужна только одна из них, чтобы завершиться быстрее всего. Затем, как только одна задача завершится, `Broadcast` инициируется в главном потоке, так что другим схемам не нужно работать впустую и они могут покинуть сцену.

Я еще не придумал фактическое использование `Signal`; добавлю позже, если будет возможность.

Как только механизм конкуренции блокировки `Cond` действительно понят, чередование `Broadcast` и `Signal` больше не представляет проблемы.

### [Locker](https://golang.org/pkg/sync/#Locker)

Просто простой интерфейс.

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

Взаимоисключающая блокировка

```go
func useMutex() {
	ch := make(chan struct{}, 2)

	var l sync.Mutex
	go func() {
		l.Lock()
		defer l.Unlock()
		fmt.Println("goroutine1: Я заблокирую примерно на 2s")
		time.Sleep(time.Second * 2)
		fmt.Println("goroutine1: Я разблокировал, идите захватывать")
		ch <- struct{}{}
	}()

	go func() {
		fmt.Println("groutine2: Ожидание разблокировки")
		l.Lock()
		defer l.Unlock()
		fmt.Println("goroutine2: Ха-ха, я заблокировал")
		ch <- struct{}{}
	}()

	// Ждать завершения goroutines
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

Как следует из названия, функция Do в Once будет выполняться только один раз.

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

RWMutex реализован на основе Mutex.

Блокировка чтения-записи, обычно используется в сценариях с большим количеством операций чтения и небольшим количеством операций записи.

1. Только одна goroutine может получить блокировку записи одновременно.
1. Любое количество goroutines может одновременно получить блокировки чтения.
1. Может существовать только блокировка записи или блокировка чтения одновременно (чтение и запись взаимно исключают друг друга).

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
	fmt.Printf("goroutine %d входит в операцию чтения...\n", n)
	v := count
	fmt.Printf("goroutine %d закончил чтение, значение: %d\n", n, v)
	rw.RUnlock()
	ch <- struct{}{}
}

func write(n int, ch chan struct{}) {
	rw.Lock()
	fmt.Printf("goroutine %d входит в операцию записи...\n", n)
	v := rand.Intn(1000)
	count = v
	fmt.Printf("goroutine %d закончил запись, новое значение: %d\n", n, v)
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

Простое распределение многозадачности

```go
func useWaitGroup() {
	// Достичь управления параллелизмом через WaitGroup в пакете sync

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

	// Пакет sync предоставляет WaitGroup, который ждет завершения всех собранных им задач goroutine. В главной goroutine Add(delta int) используется для указания количества goroutines для ожидания. После завершения каждой goroutine Done() указывает, что эта goroutine завершена. Когда все goroutines завершены, WaitGroup возвращается в главной goroutine.
}
```

## Структуры данных

### Map

```go
type Map
    func (m *Map) Delete(key interface{})
    func (m *Map) Load(key interface{}) (value interface{}, ok bool)
    func (m *Map) LoadOrStore(key, value interface{}) (actual interface{}, loaded bool)
    func (m *Map) Range(f func(key, value interface{}) bool)
    func (m *Map) Store(key, value interface{})
```    

#### Применимые сценарии

Потокобезопасная коллекция, оптимизирована для 2 сценариев:

1. Записать один раз, читать много раз
2. Несколько goroutines читают и пишут разные ключи (например, goroutine1 читает/пишет key1, goroutine2 читает/пишет key2)

#### Введение методов

Load: Чтение
LoadOrStore: Чтение, если не найдено, затем запись
Store: Запись
Range: Нельзя итерировать напрямую, нужно итерировать через callback

Конкретное использование можно найти в:
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
	// Получить временный объект, автоматически создать, если недоступен
	b := bufPool.Get().(*bytes.Buffer)
	b.Reset()
	b.WriteString(key)
	b.WriteByte('=')
	b.WriteString(val)
	os.Stdout.Write(b.Bytes())
	// Вернуть временный объект в Pool
	bufPool.Put(b)
}
```


## Ссылки:

1. [Кратко о связанных методах использования пакета Golang sync](https://deepzz.com/post/golang-sync-package-usage.html)
2. [Сравнение производительности map](https://medium.com/@deckarep/the-new-kid-in-town-gos-sync-map-de24a6bf7c2c)
