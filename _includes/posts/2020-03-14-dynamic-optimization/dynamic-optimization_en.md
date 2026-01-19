> If you can't explain it simply, you don't understand it well enough.


I sent [a previous article]() to a female friend, and the feedback was "**showing off concepts, thin expression, lack of depth, hasty conclusion, a bunch of nonsense**".

Alright, I admit, what I wrote is a pile of crap.

Today, I decided to set aside all concepts and, from a first-person perspective, re-explain this action strategy called `dynamic programming`.

## A Thief Stealing Things

![](/img/in-post/dynamic-optimization/偷.gif)

I'm a thief, it's midnight, and I'm breaking into a house. The homeowner could wake up at any time, so I need to steal all the most valuable things in the house before dawn, then run. I need to make a detailed action plan to guide me in doing this.

This task is: **steal the most valuable items within limited time**.

Stealing items has a cost, which we simply treat as time cost, measured in hours.

I created a symbol to represent the general attributes of items.

```bash
# Stealing an iPhone takes 1 hour, and it's worth 5000 yuan
iPhone（1，5000）
# Stealing a washing machine takes 3 hours, and it's worth 2000 yuan
Washing machine（3,2000）
# Stealing cash takes 1 hour, and it's worth 10000 yuan (cash)
Cash（1,10000）

And so on......
```

The table content is the value produced by the current optimal decision

Item\Time | 0:00|1:00|2:00|3:00|4:00|5:00|6:00
|---|---|---|---|---|---|---|---
Washing machine（3,2000）|0|0|0|2000|2000|2000|2000
Switch game console（1，1500）|0|1500|1500|2000|3500|3500|3500
iPhone（1，5000）|0|5000|6500|6500|6500|8500|8500
Cash in safe（3,10000）|0|5000|6500|6500|6500|16500|16500

The conclusion is obvious: if I have 5 hours, stealing `Switch game console` + `iPhone` + `Cash in safe` (1500+5000+10000=16500) is the optimal choice; if there's no cash in the house, then I can only choose `Washing machine` + `Switch game console` + `iPhone`; and if this room only has a washing machine, then I can only spend 3 hours stealing the washing machine.

From this, we can draw the first conclusion: **limited conditions (time) constrain the maximization of my gains**

But there's a problem here: just give me 5 hours and I'm done, what's the meaning of the time on the horizontal axis? Let's look at the second example.

## The King of Qin Unifying the Six States

![](/img/in-post/dynamic-optimization/seven-kingdom.jpg)

> The King of Qin unified the six states, how majestic his gaze! Wielding his sword to cut through floating clouds, all the feudal lords came from the west.
> 
> Clear judgment from heaven, great strategy surpassing all talents. Collecting weapons to cast golden figures, Hangu Pass opened to the east.
> 
> Inscribing achievements at Mount Kuaiji, galloping to Langya Terrace. Seven hundred thousand prisoners, building at Mount Li.
> 
> Still seeking immortality elixir, lost in sorrow. Crossbow shooting sea fish, long whales towering.
> 
> Nose like five mountains, waves spraying clouds and thunder. Fins covering the blue sky, how to see Penglai?
> 
> Xu Fu carrying Qin women, when will the tower ship return? Only seeing three springs below, golden coffin burying cold ashes.

Now I'm the King of Qin, determined to unify the six states. I refer to the content of the first section and model the six states of the Spring and Autumn period.

```bash
# Han is closest to my Qin, its territory value is 1, strength is 1
Han（1，1）
# Although Yan is small, it's far from me, attacking it is more laborious, the cost is higher, so strength is 2
Yan（2，1）

Others follow the same pattern......
```

Here we set a new rule:
1. **Only when strength > other states' strength can annexation be achieved**
2. **Annexing other states can add their value to one's own strength**

So we get such a table:

Other States\Own Strength |1|2|3|4|5|6|7
|---|---|---|---|---|---|---|---
Han（1，1）|0
Zhao（2,3）|0
Yan（2，1）|0
Wei（1,1）|0
Chu（5,8）|0
Qi（2,3）|0

As you can see, as the King of Qin, if my state only has strength 1, then I should just stay home and sweep the floor, what's the point of annexation wars?

I won't fill in the rest of this table.

In the end, we'll draw such conclusions:

1. When I have strength, I can defeat those weaker than me in one blow
2. When my strength grows, I can challenge those I couldn't beat before

At this point, we've answered the question from the first story: **the meaning of the horizontal axis (time)**.

**Conditions are limited, and conditions change as one's own ability grows/weakens and time passes**

This is what "dynamic" means.

And for this game, every participating state also has its own calculations. For them, this is also a dynamic programming problem. Subject and object are swapped.

From this, we can draw a new conclusion:
1. When oneself is weak, one can only unite all forces that can be united (internal and external support)

## Green Tea Scamming Simps

![](/img/in-post/dynamic-optimization/r4.jpg)

I'll directly use the table above.

Simp\Green Tea's Time|1|2|3|4|5|6|7
|---|---|---|---|---|---|---|---
Simp A（1，1）|0
Simp B（2,3）|0
Simp C（2，1）|0
Simp D（1,1）|0
Simp E（5,8）|0
Simp F（2,3）|0

At this point, I think we can be more abstract and clarify each concept.

**Limited conditions**: The green tea's youth

**Basic strategy**: Cast a wide net, get to know more men, to have more permutations and combinations

**Local optimal solution**: Under limited conditions, have N simps spend money buying me gifts. For example, this green tea is shopping with Simp A, so I send a message to Simp B to have him send me money. This is an advanced multi-threaded operation, this kind of person's understanding of transaction locks far exceeds ordinary people.

![](/img/in-post/dynamic-optimization/shy.gif)


**Maximum value**: Within limited time, the sum of all simps' contributions


There's a question here: both the King of Qin and the green tea are practitioners of dynamic programming, but why do we hate green tea bitches so much?

Because green tea bitches ignore **moral contracts and don't respect public order and good customs**.

And her approach **only focuses on short-term gains while ignoring long-term gains**.

Think about it, if simps ABCDEF all have a meeting together, that scene would be quite exciting.

![](/img/in-post/dynamic-optimization/lv.jpg)


## Conclusion

Dynamic programming is not just an algorithm, but more of a methodology that can help you better plan your life and time.
