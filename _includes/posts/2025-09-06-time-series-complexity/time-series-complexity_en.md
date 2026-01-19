When writing algorithms, we need to balance between **time** and **space** (sometimes trading space for time, sometimes trading time for space).

![image](/img/p/dont_move.gif)

But this thinking doesn't consider the actual execution situation. We might write a program that looks beautiful, but actually makes no sense and can't run at all.
Therefore, it's necessary to perform observable quantitative analysis on programs, comprehensively testing program correctness through time.

I propose the concepts of "Time Series Complexity" and "Unit Time Series Complexity" to try to complete the "last mile" of measuring algorithm efficiency.

## Traditional Time and Space Complexity

**Time Complexity** describes the relationship between the time required for algorithm execution and the input size.

Generally speaking, O(1) < O(\log n) < O(n) < O(n\log n) < O(n^2) < O(2^n) < O(n!)

**Space Complexity** describes the relationship between the memory space required during algorithm execution and the input size.
It mainly reflects the algorithm's consumption of memory resources.

Common space complexities:
- O(1): Only uses a constant number of additional variables, e.g., swapping two numbers.
- O(n): Needs to allocate an array equal in length to the input size, like a BFS queue.
- O(n^2): Storing a two-dimensional matrix.
- O(n \log n): Auxiliary array during merge sort.
- O(n!): Storing all permutation results.

## Time Series Complexity

**Time Series Complexity** describes: under the premise of satisfying time complexity and space complexity, the actual time of algorithm execution and the utilization efficiency of memory resources.

Time Series Complexity is a two-dimensional chart. The X-axis is t, and the Y-axis is `(used - buff/cache) / total`

Time Series Complexity requires observable analysis of programs. Personally, I prefer exponential decay type.

//oracle: Draw a two-dimensional coordinate system, with the horizontal axis as t and the Y-axis as (used - buff/cache) / total, only the first quadrant is needed, including examples of exponential growth simulating Moore's Law, and corresponding exponential decay charts.

![img](/img/time/Time-Series-Complexity.png)

## O(1) "AI"

This concept of Time Series Complexity breaks through the shallow advantages and disadvantages of traditional time-space algorithm complexity. In plain language, you can use a program that looks silly to simulate AI, as long as this "AI" can fool people (pass the Turing test).

```go
package main

import "fmt"

func main() {
    fmt.Println("You: Hi, AI, how are you?")
    aiReply("Hi, AI, how are you?")
}

func aiReply(input string) {
    if input == "Hi, AI, how are you?" {
        fmt.Println("AI: I'm fine, thank you! How about you?")
        if true { // Person continues asking
            fmt.Println("You: I'm good too, can you tell jokes?")
            if true { // AI answers
                fmt.Println("AI: Of course! Would you like to hear a cold joke or a hot joke?")
                if true { // Person chooses
                    fmt.Println("You: Give me a cold joke.")
                    if true { // AI outputs
                        fmt.Println("AI: Why is the computer cold? Because it's always processing cold data!")
                        if true { // Person continues
                            fmt.Println("You: Haha, any more?")
                            if true {
                                fmt.Println("AI: Yes, why doesn't AI like summer? Because it's afraid of being trained into a hot model!")
                                if true {
                                    fmt.Println("You: So funny, can you tell jokes yourself?")
                                    if true {
                                        fmt.Println("AI: Hmm... let me think... Do you know what programmers fear most?")
                                        if true {
                                            fmt.Println("You: What is it?")
                                            if true {
                                                fmt.Println("AI: Being trapped in an infinite loop!")
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
```

This program, calculated according to traditional time-space algorithms, is O(1).

Or think of it another way: you can use a ten-year-old Android phone to prove yourself, or ask your dad for a hundred million to buy a Xeon server with super powerful GPU to calculate 1+1=2. This is a personal choice, not a matter of right or wrong.

## Fake AI Phone Call

```go
package main

import (
	"fmt"
	"time"
)

// Fixed script
var script = []string{
	"Hello, this is XX Bank Intelligent Customer Service Center.",
	"We recently launched an ultra-low interest rate credit loan product with an annual interest rate as low as 3.5%.",
	"No collateral required, funds can be released in as fast as 30 minutes, very suitable for capital turnover.",
	"Would you like to learn about the specific application process?",
	"We can provide up to 500,000 in credit support based on your personal situation.",
	"The entire application process is online, very simple and convenient.",
	"If you're interested, I can arrange a dedicated account manager to contact you.",
	"Thank you for your call, we hope our loan product can help you!",
}

func fakeLoanCall() {
	fmt.Println("📞 Dialing...")
	time.Sleep(time.Second * 2)
	fmt.Println("AI: Beep beep beep... Connection successful!")

	for _, line := range script {
		time.Sleep(time.Second * 2)
		fmt.Println("AI:", line)

		// Simulate user response
		time.Sleep(time.Second)
		fmt.Println("You: Um... okay.")
	}
	fmt.Println("📞 Call ended, thank you for using the fake AI phone marketing system.")
}

func main() {
	fakeLoanCall()
}
```

```phone
📞 Dialing...
AI: Beep beep beep... Connection successful!
AI:  Hello, this is XX Bank Intelligent Customer Service Center.
You:  Um... okay.
AI:  We recently launched an ultra-low interest rate credit loan product with an annual interest rate as low as 3.5%.
You:  Um... okay.
AI:  No collateral required, funds can be released in as fast as 30 minutes, very suitable for capital turnover.
You:  Um... okay.
AI:  Would you like to learn about the specific application process?
You:  Um... okay.
AI:  We can provide up to 500,000 in credit support based on your personal situation.
You:  Um... okay.
AI:  The entire application process is online, very simple and convenient.
You:  Um... okay.
AI:  If you're interested, I can arrange a dedicated account manager to contact you.
You:  Um... okay.
AI:  Thank you for your call, we hope our loan product can help you!
You:  Um... okay.
📞 Call ended, thank you for using the fake AI phone marketing system.
```

Many computer nerds like to think and analyze problems according to traditional computer definitions. But they don't recognize that problems themselves come from life.

Therefore, through the very simple example of mayfly mating, we can explain the concept of "Time Series Complexity".

## Mayfly Aerial Mating

Grasping: After the male successfully approaches the female, he uses his slender forelegs to tightly grasp the female's thorax.

Position adjustment: The male then bends the long claspers at the end of his abdomen to firmly clamp the end of the female's abdomen.

Connection: At this point, the two mayflies present a "male on top, female below" tandem position, flying together.

Insemination: During connected flight, the male's penis connects with the female's spermathecal opening, injecting the spermatophore (sperm sac) into the female's body. The entire mating process is completed entirely in flight, lasting from a few seconds to several minutes.

## Unit Time Series Complexity

**Unit Time Series Complexity** is a refined formula for composite measurement of algorithm efficiency.
On the basis of memory, CPU/GPU is added as needed.
Used to measure algorithm unit resource utilization efficiency.

Unit Time Series Complexity is a three-dimensional chart.
However, three-dimensional charts are too abstract, generally reduced to 2 two-dimensional charts. Or merge the Y-axis to become two curves in a two-dimensional chart.

### Unit CPU Time Series Complexity

Unit CPU Time Series Complexity is a three-dimensional chart.
X-axis is t,
Y-axis is `(used - buff/cache) / total`,
Z-axis is `cpu_load1`.

Can also be replaced with `load5` and `load15` as needed.

- cpu_load1: Average load over the past 1 minute
- cpu_load5: Average load over the past 5 minutes
- cpu_load15: Average load over the past 15 minutes

### Unit GPU Time Series Complexity

Unit GPU Time Series Complexity is a three-dimensional chart.
X-axis is t,
Y-axis is `(used - buff/cache) / total`,
Z-axis is `gpu_utilization`.

Or replace `gpu_utilization` with `gpu_memory_utilization`.

## P Theory: 3-Second Real Man

![image](/img/in-post/three-second/free-m.jpg)

Assuming TA only has 3 seconds, then the horizontal axis interval of this function is [0,3], where 0 is a relative instantaneous concept, representing "now".

After 3 seconds, `free -m` returns to zero, meaning "not a drop left".

From a pure time perspective, the mayfly's mating process is quite efficient. But if we replace it with my good neighbor, I generally suggest they see a urologist.

If their partner isn't too ugly, I might consider taking care of them as well.

![image](/img/in-post/three-second/forgive.jpg)

## Extension

The Y-axis can be replaced with unit energy consumption indicators, used to plan and construct energy-saving smart buildings.

Rather than saying the vertical axis is memory utilization, it's better to say the vertical axis represents the utilization efficiency of a resource.

Let's see where the limits of Moore's Law really are.

## Conclusion

The great peng spreads its wings, hating the sky is too low
