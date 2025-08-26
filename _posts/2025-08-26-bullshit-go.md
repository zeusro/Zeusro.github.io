---
layout:       post
title:        "How To Do In Go"
subtitle:     "如何写出坑爹的go代码"
date:         2025-08-26
author:       "Zeusro"
header-img:   "img/p/pp.png"
header-mask:  0.3
catalog:      true
tags:
    - P
---

The point is to break the rule everyday.

## Where is my last son ?

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

result:

```go
[999 3 2 1]
[999 3 2]
```

## I wanna break out of my parents's control

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

result:

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

## Magic range

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

result：

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

result：

```go
Sergey
Sergey
Sergey
```

Go 切片绕坑指南
<https://www.lagou.com/lgeduarticle/66511.html>

go语言坑之for range
<https://studygolang.com/articles/9701>

go语言坑之for range
<https://blog.csdn.net/u010824081/article/details/77986675>


