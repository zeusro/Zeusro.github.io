毎日ルールを破ることがポイントです。

## 私の最後の息子はどこにいる？

```go
package main

import (
	"fmt"
)

func main() {
	var mySon []int
	for i := 1; i <= 3; i++ {
		mySon = append(mySon, i)
	}
	reverse(mySon)
	fmt.Println(mySon)
}

func reverse(s []int) {
	s = append(s, 999)
	for i, j := 0, len(s)-1; i < j; i++ {
		j = len(s) - (i + 1)
		s[i], s[j] = s[j], s[i]
	}
	fmt.Println(s)
}
```

結果：

```go
[999 3 2 1]
[999 3 2]
```

## 親のコントロールから抜け出したい

```go
func myParent(chExit chan bool) {
	for {
		select {
		case v, ok := <-chExit:
			if !ok {
				fmt.Println("You are still too YOUNG,so the result is ", v)
				break
			}
			fmt.Println("ch1 val =", v)
		}

	}
	fmt.Println("Goodbye,my son.")
}
```

結果：

```go
import (
	"fmt"
	"time"
)

func main() {
	c := make(chan bool)
	go myParent(c)
	c <- true
	close(c)
	time.Sleep(time.Duration(2) * time.Second)
}
```

## マジックレンジ

```go
package main

import "fmt"

func main() {
    slice := []int{0, 1, 2, 3}
    myMap := make(map[int]*int)

    for index, value := range slice {
        myMap[index] = &value
    }
    prtMap(myMap)
}

func prtMap(myMap map[int]*int) {
    for key, value := range myMap {
        fmt.Printf("map[%v]=%v\n", key, *value)
    }
}
```

結果：

```go
map[2]=3
map[3]=3
map[0]=3
map[1]=3
```

## Go Go Go

```go
package main
import (
    "fmt"
    "time"
)
func main()  {
    str := []string{"I","am","Sergey"}
    for _,v := range str{
        go func() {
            fmt.Println(v)
        }()
    }
    time.Sleep(3 * time.Second)
}
```

結果：

```go
Sergey
Sergey
Sergey
```

Goスライスの落とし穴ガイド
<https://www.lagou.com/lgeduarticle/66511.html>

Go言語のfor rangeの落とし穴
<https://studygolang.com/articles/9701>

Go言語のfor rangeの落とし穴
<https://blog.csdn.net/u010824081/article/details/77986675>
