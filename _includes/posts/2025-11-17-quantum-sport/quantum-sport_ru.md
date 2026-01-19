## Введение

После приземления в аэропорту Шэньчжэня 3 мая 2025 года я заметил, что весь аэропорт — от трапов до внешней стороны — был обклеен рекламой Alipay и Alibaba Cloud.
Это напомнило мне старую игру Pac-Man: в сетке xy два игрока управляют своими персонажами Pac-Man, чтобы съесть все шарики, разбросанные по сетке.

Проще говоря, это проблема Pac-Man: «Как N Pac-Man могут потребить все шарики без блокировки (каждый шарик можно съесть только один раз)?»
Однако, если мы программно абстрагируем и смоделируем этот сценарий, это точно отражает проблему двух потоков в пространстве txy, обращающихся к одноразовому ресурсу без блокировки.

Опираясь на исторические решения этой проблемы, я разработал три версии программ и кода. В третьей версии я смоделировал «квантовое движение в N-мерном пространстве», используя алгоритм параллельного времени.

## Формальная логика и определения

Квант: Наиболее фундаментальная, неделимая дискретная единица, которую физическая величина (такая как энергия, угловой момент или заряд) может принять в физической системе.

Оператор: Отображение на функциональном пространстве или векторном пространстве.

N-мерное пространство: N-мерное пространство с временем в качестве первой оси. Например, tx — это (временное) двумерное пространство, txy — это (временное) трёхмерное пространство, а txyz — это (временное) четырёхмерное пространство.

<img src="/img/pay.png" alt="pay" style="width:40%; height:auto; display:block;">

Алгоритм параллельного пространства: Выделяя несколько пространств памяти, он строит несколько N-мерных пространств параллельно. Каждый оператор/квант движется в своём собственном N-мерном пространстве, в конечном итоге сходясь с временем в качестве ключа. Это обеспечивает решение для параллельных потоков для доступа к одноразовым ресурсам без блокировок.
Я называю это решение алгоритмом параллельного пространства.

Столкновение операторов: Контакт между двумя операторами, происходящий в одно и то же время. Используя Pac-Man в качестве примера, столкновение операторов относится к двум сущностям Pac-Man, одновременно обращающимся к ограниченному ресурсу.

Временная неподвижная точка: Общее расширение неподвижной точки Какутани до (не)евклидовых пространств. Поскольку евклидовы пространства не содержат определения «сознания», неподвижная точка Какутани на самом деле является частным случаем временной неподвижной точки. Временные неподвижные точки могут быть уменьшены до неподвижных точек Какутани по мере необходимости, с конкретикой, определяемой контекстом.

Точка: Двумерная структура, смоделированная с использованием `golang struct` в декартовой системе координат.

```go
// Определить структуру точки
type Point struct {
	X float64
	Y float64
}
```

Отрезок: Структура, реализованная с использованием `golang struct`.

```go
type Line struct {
	A Point
	B Point
}
```

Длина отрезка: Случайное время служит единственным критерием для измерения длины N-мерного отрезка.

```go
// Distance использует случайное время как единственный стандарт измерения длины N-мерного отрезка
func (l Line) Distance() time.Duration {
	// Вычислить евклидово расстояние
	dx := l.A.X - l.B.X
	dy := l.A.Y - l.B.Y
	dist := math.Sqrt(dx*dx + dy*dy)

	// Отобразить расстояние в диапазон 1ns ~ 1_000_000ns (1ms), используя плавное гиперболическое тангенсное отображение
	ns := 1 + int64(999999*math.Tanh(dist/10))

	// Добавить случайное возмущение ±10%
	jitter := rand.Float64()*0.2 - 0.1
	ns = int64(float64(ns) * (1 + jitter))

	// Ограничить диапазон
	if ns < 1 {
		ns = 1
	} else if ns > 100_0000 {
		//Go позволяет добавлять _ в целочисленные или плавающие литералы для разделения цифр:
		ns = 100_0000
	}
	return time.Duration(ns) * time.Nanosecond
}
```

## Решение одноразового циклического временного вытеснения на основе блокировок чтения-записи

Если рассматривать все шарики на карте как эксклюзивный ресурс, то, используя порядковый номер в качестве ключа и точку на карте в качестве значения, можно создать словарь на основе блокировок чтения-записи:

 ```go
 // Структура Beans: встроенный параллельный словарь key->Point
type Beans struct {
	mu    sync.RWMutex
	items map[int]model.Point
}
```

2 потока, основываясь на скорости времени, соревнуются за эксклюзивный ресурс, побеждает тот, кому требуется меньше времени, таким образом получается окончательный ответ.

```go
type RWLock struct {
}

// GetCost решает задачу через O(n) блокировку чтения-записи
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
	// Упростить проблему, используя две случайные начальные точки в качестве начальных точек Pac-Man
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
	fmt.Println("Pac-Man Alipay:")
	fmt.Println(beansA)

	aliyunBeans := make([]model.Bean, 0)
	for _, item := range aliyun.Lines {
		aliyunBeans = append(aliyunBeans, model.Bean{Line: item})
	}
	beansB := aliyun.EatBeans(aliyunBeans)
	fmt.Println("Pac-Man Alibaba Cloud:")
	fmt.Println(beansB)

	return end.Sub(start)
}
```

Здесь решение основано на временном вытеснении одного потока. Если использовать `go routine`, нужно реализовать традиционное решение с блокировкой чтения-записи, здесь не буду подробно останавливаться.

Полное решение см.:
 [https://github.com/zeusro/system/tree/main/function/local/n/china/shenzhen/szx/v1](https://github.com/zeusro/system/tree/main/function/local/n/china/shenzhen/szx/v1)

## Решение однопоточного сообщения очереди

Если рассматривать Alibaba Cloud и Alipay как единое целое (оба принадлежат группе Alibaba), то можно преобразовать проблему N Pac-Man в проблему 1 Pac-Man, используя простую асинхронную очередь сообщений:

```go
type Information struct {
	date    time.Time
	content string
}

type AlibabaGroup struct {
	N    int           // масштаб алгоритма
	Cost time.Duration // общее время
	model.Alipay
	model.Aliyun
}

func (a *AlibabaGroup) Actor(core string, inbox <-chan Information) {
	for msg := range inbox {
		fmt.Printf("[%v]Actor %s received[%d]: %s\n", msg.date, core, a.N, msg.content)
		a.N++
	}
}

// EatBean Если преобразовать проблему в единое целое (Aliyun и Alipay являются активами группы Alibaba), то проблема может быть упрощена до простой модели производитель-потребитель
func (ali *AlibabaGroup) EatBean(beans []model.Bean) map[time.Time]model.Point {
	var m map[time.Time]model.Point = make(map[time.Time]model.Point)
	now := time.Now()
	start := now
	// fmt.Println(start)
	n := len(beans)
	var wg sync.WaitGroup
	memory := make(chan Information, 1) // ограничить до 1, принудительно преобразовать в структуру синхронной очереди
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

Также можно назвать решением `江崎プリン`.

Полный код см.
[https://github.com/zeusro/system/tree/main/function/local/n/china/shenzhen/szx/v2](https://github.com/zeusro/system/tree/main/function/local/n/china/shenzhen/szx/v2)

## Алгоритм параллельного пространства-времени

Алгоритм параллельного пространства-времени, простыми словами, разделяет N одинаковых пространств памяти txy, позволяя n потокам двигаться в своих собственных N-мерных пространствах, в конечном итоге выполняя дедупликацию через словарь и нормализацию для слияния.

Решение немного похоже на «решение одноразового циклического временного вытеснения на основе блокировок чтения-записи», но перемоделирует объект метаданных и расширяет определение N-мерных отрезков.

```go
// NLine N-мерный отрезок на основе времени
type NLine struct {
	t       time.Time
	actorID string
	model.Line
}

type Journey struct {
	Lines  []model.Line             // N-мерные отрезки (для упрощения вычислений время не вводится) как массив двумерных отрезков
	NBeans map[model.Bean]time.Time // N-мерные объекты
}
```

В `Beans` несут N-мерные отрезки.

```go
// Структура Beans: встроенный параллельный словарь key->Point
// Для нулевой зависимости напрямую копировать версию v1, не использовать наследование
type Beans struct {
	Name    string
	mu      sync.RWMutex
	items   map[int]model.Point
	FirstNL NLine
}

func (beans *Beans) Thought(n int, date time.Time) *Journey {
	// Упростить проблему, используя случайную начальную точку в качестве начальной точки Pac-Man
	a := make([]model.Point, 1)
	first, _ := beans.GetAndRemove(0)
	journey := NewJourney(n - 1)
	a[0] = first
	// n точек могут генерировать только n-1 отрезков
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
		// Сбросить условие, подготовиться к следующему раунду
		a = append(a, p)
	}
	result, err := journey.Validate()
	if !result || err != nil {
		fmt.Println("Journey проверка не удалась:", err)
		return journey
	}
	return journey
}
```

Ядро решения — алгоритм `DoubleThought` — сравнивая длину каждого N-мерного отрезка, исключая N-мерные отрезки с более длительным временем, таким образом при окончательной нормализации можно получить полные N-мерные отрезки.

```go
func DoubleThought(n int) []NLine {
	m := make(map[int]model.Point, n)
	for i := 1; i < n; i++ {
		m[i] = model.RandonPoint()
	}
	p1 := model.RandonPoint()
	p2 := model.RandonPoint()
	// принудительно назначить разные начальные точки
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
	// нормализовать и объединить, удалить лишние точки.
	nLines := make(map[time.Time]NLine)
	nMap := NewNLineMap(0)
	for k, t1 := range journey1.NBeans {
		t2, ok := journey2.NBeans[k]
		if !ok {
			continue
		}
		// отставание означает избиение
		if t1.After(t2) {
			delete(journey1.NBeans, k)
			line := NLine{t: t2, Line: k.Line, actorID: bean2.Name}
			nLines[t2] = line
			nMap.Add(t2, line)
			continue
		}
		if t2.Equal(t1) {
			fmt.Printf("%v:%v два Pac-Man одновременно достигли %v, произошло столкновение\n", t1, t2, k.Line)
		}
		delete(journey2.NBeans, k)
		line := NLine{t: t1, Line: k.Line, actorID: bean1.Name}
		nLines[t1] = line
		nMap = nMap.Add(t1, line)
		continue
	}
	nMap.AddZero(bean1.FirstNL)
	nMap.AddZero(bean2.FirstNL)
	fmt.Printf("%v : общее количество N-мерных отрезков：%d;Pac-Man %v всего %v;Pac-Man %v всего %v;\n", start,
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

Используя 50 точек в качестве масштаба алгоритма, запустить один тестовый случай для анализа.

```go
func TestDoubleThought(t *testing.T) {
	lines := DoubleThought(50)
	t.Logf("len(lines)：%v", len(lines))
}
```

Результат следующий:

```bash
go test -run TestDoubleThought -v
=== RUN   TestDoubleThought
2025-11-17 08:08:01.473679 +0800 CST m=+0.000456626 : n维线段总数：50;吃豆人aliyun总数21;吃豆人alipay总数29;
len(lines):50
0:2025-11-17 08:08:02.411679 +0800 CST m=+0.938456626 aliyun:(298.780000,815.780000)-(672.440000,359.620000)
1:2025-11-17 08:08:02.473679 +0800 CST m=+1.000456626 alipay:(511.320000,964.490000)-(672.440000,359.620000)
2:2025-11-17 08:08:03.396679 +0800 CST m=+1.923456626 alipay:(672.440000,359.620000)-(395.370000,5.850000)
...
```

В алгоритме `DoubleThought`, поскольку начальному «Pac-Man» принудительно назначены 2 разные случайные позиции, что эквивалентно 51 точке, поэтому окончательно генерируемые N-мерные отрезки (n точек генерируют n-1 отрезков) составляют 50.

```go
p1 := model.RandonPoint()
p2 := model.RandonPoint()
	// принудительно назначить разные начальные точки
	for p1.Compare(p2) {
		p2 = model.RandonPoint()
	}
```

Каждый запуск программы даёт случайные результаты, из-за проблемы точности времени с небольшой вероятностью происходит «столкновение операторов» — то есть в один и тот же момент n операторов одновременно обращаются к одной и той же точке.

Но 1-й|2-й|n-й N-мерный отрезок обязательно соответствует характеристике одинаковой точки B:

```bash
0:2025-11-17 08:08:02.411679 +0800 CST m=+0.938456626 aliyun:(298.780000,815.780000)-(672.440000,359.620000)
1:2025-11-17 08:08:02.473679 +0800 CST m=+1.000456626 alipay:(511.320000,964.490000)-(672.440000,359.620000)
2:2025-11-17 08:08:03.396679 +0800 CST m=+1.923456626 alipay:(672.440000,359.620000)-(395.370000,5.850000)
```

Точка `(672.440000,359.620000)` — это временная неподвижная точка. Потому что независимо от того, как случайно выполняется программа, независимо от того, сколько случайных потоков, эти N случайных потоков обязательно впервые достигнут одной и той же точки.

Позиция этой точки, хотя и бесконечно изменяется со временем, но неподвижная точка действительно существует.

С точки зрения текущего традиционного трёхмерного угла, это противоречие. Потому что исходная проблема — это «ограниченный ресурс» компьютера, каждый раз доступен только одним потоком. Но с точки зрения N-мерного параллельного пространства это не противоречие.

Потому что согласно характеристикам квантового запутанного состояния, одновременное наблюдение из-за проблемы точности времени не может определить, это 1 точка, или 2 точки, или n точек.
И в других «параллельных пространствах-временах» на самом деле также те же точки движения, только при «наблюдении» коллапсируют в один результат.

Это решение без блокировок для многопоточности, разработанное с использованием времени в качестве ключа, одновременно являющееся программной интерпретацией квантового движения в N-мерном пространстве.
И этот алгоритм также объясняет, почему неподвижная точка Какутани является частным случаем временной неподвижной точки.

Полный алгоритм см.:
[https://github.com/zeusro/system/tree/main/function/local/n/china/shenzhen/szx/v3](https://github.com/zeusro/system/tree/main/function/local/n/china/shenzhen/szx/v3)

## Разные пути ведут к одному концу, но в конце нужно расстаться; время приходит и уходит, всё непостоянно

## Ссылки

[1] 
Квантовая интерпретация движения (2025)
https://github.com/zeusro/quantum/blob/main/README.zh.md

## Опубликованные и готовящиеся к публикации статьи

1. Zeusro（2025）Время — первое измерение, превосходящее материю и сознание https://github.com/zeusro/quantum/blob/main/t.zh.md
1. Zeusro（2025）Квантовая интерпретация движения https://github.com/zeusro/quantum/blob/main/README.zh.md

## Благодарности

Благодарность [『攻殻機動隊 SAC_2045』](（https://www.ghostintheshell-sac2045.jp/）)
