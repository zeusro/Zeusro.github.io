## Preface

The original article was well written, so I decided to excerpt a portion of it.

Excerpted from [Golang Server Network Layer Implementation](https://segmentfault.com/a/1190000005132717#articleHeader0)

## Traditional Language Network Layer Processing

Services need to serve N clients simultaneously, so the traditional programming approach is to use IO multiplexing, which captures events for N sockets in a single thread, and then actually `read()` or `write()` when read/write events occur, in order to improve throughput:

![image](/img/in-post/golang-network/2016-05-16-golang-network-00.jpg)

In the above diagram:

The green thread is the thread that accepts client TCP connections, using blocking calls to `socket.accept()`. When a new connection arrives, the `socket` object conn is added to the IO multiplexing queue.

The purple thread is the blocking call for IO multiplexing, usually implemented using system calls like `epoll`. When any `socket` in the IO multiplexing queue has data arriving, or when the write buffer becomes free, the `epoll` call can return, otherwise the `epoll` call blocks. The actual sending and receiving of data are completed in the purple thread. So to improve throughput, `read` and `write` for a `socket` should use non-blocking mode, which maximizes system throughput. For example, suppose you're calling a blocking `write` on a `socket`. Before the data is completely sent, `write` cannot return, which prevents the entire `epoll` from entering the next loop. If other `sockets` have read-ready at this time, they cannot respond immediately. So non-blocking read/write will return immediately when a fd is slow to read/write, rather than waiting until the read/write is complete. This improves throughput. However, using non-blocking read/write greatly increases programming difficulty.

The purple thread is responsible for decoding data and putting it into a queue, waiting for worker threads to process. When worker threads have data to send, they also put the data into a send queue and notify the purple thread through some mechanism that the corresponding `socket` has data to write, so that data is written to the `socket` in the purple thread.

The programming difficulty of this model is mainly reflected in:

1. Few threads (and not too many), causing one thread to need to handle multiple descriptors, thus there are issues with maintaining descriptor state. Even business-level sessions need to be carefully maintained.
1. Non-blocking IO calls make descriptor state more complex
1. Synchronous processing of queues

## How Golang Implements the Network Layer

By referring to multiple Golang open source programs, the author's conclusion is: use goroutines recklessly. So a Golang version of the network model is roughly like this:

![image](/img/in-post/golang-network/2016-05-16-golang-network-01.jpg)

The above diagram shows the server module structure for a single client connection, with the same color representing a coroutine:

The green goroutine still accepts TCP connections

After the handshake completes and `accept` returns a `conn object`, use a separate `goroutine` to block read (purple), and use a separate goroutine to block write (red)

Read data is decoded and put into a read `channel`, and processed by the blue `goroutine`

When data needs to be written, the blue goroutine writes data to the write `channel`, which triggers the red `goroutine` to encode and write to `conn`

It can be seen that for a single client, the server has at least 3 `goroutines` serving this client alone. If viewed from a thread perspective, this is a waste, but this is the benefit of coroutines. This model is easy to understand because it's consistent with normal thinking. And all calls are blocking, so there's no need to maintain state.

Let's look at the case of multiple clients:

![image](/img/in-post/golang-network/2016-05-16-golang-network-02.jpg)

Among multiple clients, although the same color is used to represent goroutines, they are actually independent goroutines. You can imagine the number of goroutines will be astonishing. However, there's no need to worry! Such an application may only have a few actual threads.
