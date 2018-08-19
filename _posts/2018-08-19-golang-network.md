---
layout:       post
title:        "[转载]golang和传统语言的网络层处理的对比"
subtitle:     ""
date:         2018-08-19
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - golang
---

## 前言

原文写的挺好的,我决定节选一部分过来

节选自[Golang服务器的网络层实现](https://segmentfault.com/a/1190000005132717#articleHeader0)

## 传统语言的网络层处理
服务需要同时服务N个客户端，所以传统的编程方式是采用IO复用，这样在一个线程中对N个套接字进行事件捕获，当读写事件产生后再真正`read()`或者`write()`，这样才能提高吞吐：

![image](/img/in-post/golang-network/2016-05-16-golang-network-00.jpg)

上图中：

绿色线程为接受客户端TCP链接的线程，使用阻塞的调用`socket.accept()`，当有新的连接到来后，将`socket`对象conn加入IO复用队列。

紫色线程为IO复用的阻塞调用，通常采用`epoll`等系统调用实现IO复用。当IO复用队列中的任意`socket`有数据到来，或者写缓冲区空闲时可触发`epoll`调用的返回，否则阻塞`epoll`调用。数据的实际发送和接收都在紫色线程中完成。所以为了提高吞吐，对某个`socket`的`read`和`write`都应该使用非阻塞的模式，这样才能最大限度的提高系统吞吐。例如，假设正在对某个`socket`调用阻塞的`write`，当数据没有完全发送完成前，`write`将无法返回，从而阻止了整个`epoll`进入下一个循环，如果这个时候其他的`socket`有读就绪的话，将无法第一时间响应。所以非阻塞的读写将在某个fd读写较慢的时候，立刻返回，而不会一直等到读写结束。这样才能提高吞吐。然而，采用非阻读写将大大提高编程难度。

紫色线程负责将数据进行解码并放入队列中，等待工作线程处理；工作线程有数据要发送时，也将数据放入发送队列，并通过某种机制通知紫色线程对应的`socket`有数据要写，进而使得数据在紫色线程中写入`socket`。

这种模型的编程难度主要体现在：

1. 线程少（也不能太多），导致一个线程需要处理多个描述符，从而存在对描述符状态的维护问题。甚至，业务层面的会话等都需要小心维护
1. 非阻塞IO调用，使描述符的状态更为复杂
1. 队列的同步处理

## Golang如何实现网络层

通过参考多个Golang的开源程序，笔者得出的结论是：肆无忌惮的用goroutine吧。于是一个Golang版的网络模型大致是这样的：


![image](/img/in-post/golang-network/2016-05-16-golang-network-01.jpg)

上图是单个客户端连接的服务器模块结构，同样的一个颜色代表一个协程：

绿色goroutine依然是接受TCP链接

当完成握手`accept`返回`conn对象`后，使用一个单独的`goroutine`来阻塞读（紫色），使用一个单独的goroutine来阻塞写（红色）

读到的数据通过解码后放入读`channel`，并由蓝色的`goroutine`来处理

需要写数据时，蓝色的goroutine将数据写入写`channel`，从而触发红色的`goroutine`编码并写入`conn`

可以看到，针对一个客户端，服务端至少有3个`goroutine`在单独为这个客户端服务。如果从线程的角度来看，简直是浪费啊，然而这就是协程的好处。这个模型很容易理解，因为跟人们的正常思维方式是一致的。并且都是阻塞的调用，所以无需维护状态。

再来看看多个客户端的情况：

![image](/img/in-post/golang-network/2016-05-16-golang-network-02.jpg)

在多个客户端之间，虽然用了相同的颜色表示goroutine，但实际上他们都是独立的goroutine，可以想象goroutine的数量将是惊人的。然而，根本不用担心！这样的应用程序可能真正的线程只有几个而已。