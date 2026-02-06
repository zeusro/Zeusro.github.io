The original paper for the time-series library (http://github.com/zeusro/data) has been lost, so I can only piece together the time-series part from limited memory.

Only through practice over time can the correctness of a program be verified. I therefore propose the time-series meta-programming model—a new programming paradigm for modeling the real world, a design philosophy independent of programming language.

On this basis, **time-series complexity** is introduced: under the premise of satisfying traditional time and space complexity, two-dimensional plots (e.g. t vs. memory utilization) and even three-dimensional plots (adding CPU/GPU load) are used to characterize the actual execution time and resource utilization of algorithms.

## Time Series

**Time series**: A set of data arranged in chronological order that records how the state of the same object changes over time.  
A time series has only `Watch` as its sole API. `Watch` can be split in order into `Read` and `Write` interfaces.

## Time-Series Objects

For a time-series object, time must be the first member and must be reflected in the initialization function.  
Any data generated based on time is time-series data.

```go
type DeadMonkey struct {
	Birth       time.Time
	GoldenStaff []NLine // Golden Cudgel – Parametric Segment
	m           int     // consumer scale
	n           int     // algorithm scale
	ZeroPoints  []model.Point
	cost        time.Duration
}
```

## Time-Series Functions

For a time-series function, time must be the first parameter. The first member of the return value must be a time-series object.  
The input time and output time represent the lower and upper time bounds of the function.

```go
// NewDeadMonkey
// m combat objects
// n unique resource count / algorithm scale
func NewDeadMonkey(birth time.Time, m, n int) *DeadMonkey {
	dead := DeadMonkey{
		Birth: birth,
		m:     m,
		n:     n,
	}
	zeroPoints := make([]model.Point, m)
	p0 := model.RandonPoint()
	zeroPoints[0] = p0
	for i := 1; i < m; i++ {
		p1 := model.RandonPoint()
		// As long as it doesn't duplicate the previous point; global duplicates are ignored
		for p1.Compare(zeroPoints[i-1]) {
			p1 = model.RandonPoint()
		}
		zeroPoints[i] = p1
	}
	dead.ZeroPoints = zeroPoints
	return &dead
}

// SleepAndReturnNewTime accepts a time argument, sleeps randomly, then returns the latest time
func SleepAndReturnNewTime(inputTime time.Time) time.Time {
    // Set random seed
    rand.Seed(time.Now().UnixNano())

    // Generate random sleep duration, 1 to 5 seconds
    sleepDuration := time.Duration(rand.Intn(5)+1) * time.Second

    // Sleep for random duration
    time.Sleep(sleepDuration)

    // Return current time
    return time.Now()
}
```

## Time-Series Distance

Use composite criteria of time plus other conditions (e.g. on a 4-dimensional sphere, distance alone may be used for conversion; or time plus the Haversine formula).

## Time-Series Logging

Log output must follow the format “time + content”.

## Time-Series Complexity

Time-series complexity: Under the prerequisite of time complexity and space complexity, the actual execution time of an algorithm and the utilization efficiency of memory resources.

Time-series complexity is represented as a two-dimensional plot. The X-axis is t, the Y-axis is `(used - buff/cache) / total`.

The Y-axis can use other metrics as needed, such as overall CPU/GPU utilization.

Unit time-series complexity is a three-dimensional plot. Three-dimensional plots are rather abstract; they can be reduced to two 2D plots, or the Y-axes can be merged into two curves on a single 2D plot.

**Unit CPU time-series complexity** is a three-dimensional plot: X-axis t, Y-axis (used - buff/cache) / total, Z-axis cpu_load1.

**Unit GPU time-series complexity** is a three-dimensional plot: X-axis t, Y-axis (used - buff/cache) / total, Z-axis gpu_utilization.

Time-series complexity requires observability analysis of the program.

## Time-Series Space

A space of two or more dimensions composed of time series.
