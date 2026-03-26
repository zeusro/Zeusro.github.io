Idempotency is an important principle in program design.

Take the simplest example: withdrawing cash from an ATM. You confirm the amount and press "confirm", then the machine starts dispensing money. But if pressing "confirm" again during this process makes the ATM continue dispensing, then this design is non-idempotent.

Of course, reality is not that generous. The time window between pressing confirm and receiving cash belongs to a "transaction lock" phase in program design. During this period, pressing confirm 100 times is still futile.

Before we noticed it, ATMs also became consumer electronics that are about to be phased out. But principles like idempotency and database transactions have not disappeared.

## Non-idempotent Elevator

For example, I recently encountered a kind of "non-idempotent elevator". In traditional commercial buildings, operations usually set up a "1-to-N idempotency" model for convenience: after pressing down, all down indicators light up together, and then the dispatch center assigns the nearest elevator. I call this an "idempotent elevator".

A non-idempotent elevator separates the up/down panel buttons from the dispatch center. For instance, if a building has 3 adjacent elevators, pressing up/down on one panel only controls the "1-to-1" mapped elevator. If you want another one, you press another panel. I call this a "non-idempotent elevator". This article only discusses the non-idempotent elevator scenario.

## Individual selfishness causes collective delay

Based on historical statistical patterns, and modeling the "non-idempotent elevator" scenario with time-series programming, suppose working hours are 9:00 ~ 18:30. Then within 10 minutes of commuting critical points, for office buildings with floors <10, in my experience, taking the stairs is basically faster.

If there is only 1 person in the scenario, the strategy for choosing an elevator is actually very simple: choose "the nearest elevator moving in the same direction" as the optimal strategy:

```go

type Work struct {
	Floor       int16     // working floor
	WorkHours   time.Time // work start time
	ClosingTime time.Time // work end time
}

// Person represents a person
type Person struct {
	Time        time.Time // time
	Floor       int16     // current floor
	TargetFloor int16     // target floor
	work        Work
}

func (p *Person) MVP(elevators []Elevator) (int, *Elevator) {
	t := p.Time
	if p.work.Floor < 10 && (t.Sub(p.work.ClosingTime).Abs() < 10*time.Minute || t.Sub(p.work.WorkHours).Abs() < 10*time.Minute) {
		//walking
		return -1, nil
	}
	if len(elevators) == 0 {
		return -1, nil
	}
	distance := time.Hour << 10
	var bestElevator Elevator
	var n int
	for k, e := range elevators {
		temp := *e.Status(t)
		if d := temp.Distance(p); d < distance {
			distance = d
			n = k
			bestElevator = temp
		}
	}
	// find and choose the nearest elevator
	return n, &bestElevator
}
```

However, in reality, cases like N people competing for 3 elevators are much more common. This strategy fails immediately under the N-person scenario.

Because "how many people are waiting for elevators in this building" is a black box for everyone not in the control room.

So many people choose the "all" strategy - pressing every button together, and even going up first then down after work. Even if no one presses in reverse order, if everyone presses all buttons after work, down-moving elevators will still stop at almost every floor.

Of course, some people may argue we can set an "FL" state: when an elevator is fully loaded, it goes straight down without stopping at any floor.
But in a 4-people-4-elevators case, the problem is still obvious - 4 people are distributed on different floors, decision directions are completely random, and if everyone presses all 4 panels together, elevator resources are wasted to the greatest extent.

Non-idempotent elevators expose one fact: **maximizing individual benefit harms collective benefit, and eventually harms one's own payoff**. Because taking elevators is meant to save as much time as possible, and the utility function is time.
If everyone presses all buttons, it seems all elevators will come toward them, but in the end it still maximizes total elevator riding time.

## The estate division problem in P=NP

A non-idempotent elevator represents the **absolute conflict between collective interest and individual interest**. Other than turning elevators into an "idempotent" model and letting the dispatch center coordinate,
there seems to be no good solution. But if we directly quantify elevators as estate assets, and treat elevator allocation as the cake-cutting problem in P=NP (personally I prefer to call it the "estate division" problem), then the issue seems slightly simpler.

Let's transform the problem: shrink N participants into a controllable number of "children", and convert elevators into cash. Then all participants are no longer in a "black box" state relative to each other.

In my view, fair division (everyone believes they have received at least 1/n value of the cake) does not exist - suppose I am the family asset manager and have several children. For long-term asset growth, it is impossible to split all cash into equal N shares and hand one share to a son under 18.

Not to mention that when people look in the mirror, they tend to self-enhance (mere exposure effect). Rating oneself higher than objective facts is a common phenomenon. This cognitive bias, combined with objective constraints, makes it impossible to have an estate-division solution fair to everyone.

According to historical statistical experience, the final outcome of estate division still depends on each heir's investment and wealth-management capability. Based on real financial returns and talent strengths, and through the test of time, a solution can finally emerge.

At this point, I finally understood the behavioral art of distributed courtship by [Shoggoth](https://github.com/zeusro/system/blob/main/function/web/shoggoth.go): using the scumbag strategy of **casting a wide net and catching more fish**, to achieve multi-object differential learning gradient descent optimized for time efficiency.

## Nearby advantage

A little closer to the bank,
Where coins and notes are in the rank.
