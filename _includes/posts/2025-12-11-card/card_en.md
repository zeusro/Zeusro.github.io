WeChat Pay’s strategy is based on the last transaction, while Alipay’s payment order is always chaotic. Whether it is automatic payment order or system auto‑matching, the platform bias is obvious. None of these behaviors are what I want.

I decided to design my own time‑series credit‑card consumption strategy to control every single credit‑card payment.

## Formal Logic and Definitions

**Time series**: a sequence of data points arranged according to the order in which they occur over time.

**Time‑series object**: a programming‑language object based on a time series. *Time must be the first member.*

Example:
```go
type Deal struct {
    t       time.Time
    Money   float32
    policy  string
    Payment Card
}
```

**Time‑series function**: a programming‑language function based on a time series. *Time (or a time‑series object) must be the first parameter.*

Example:
```go
func (p *DiscountPolicys) MVP(d Deal) DiscountPolicy {
    var best DiscountPolicy
    var maxDiscount float32 = 0
    for _, policy := range p.Resource {
        if !policy.Match(d) {
            continue
        }
        if policy.Discount >= maxDiscount {
            continue
        }
        best = policy
        if best.N > 0 {
            maxDiscount = best.Discount
            // reduce resource pool
            best.N--
        }
    }
    if len(best.Bank) > 0 {
        p.Resource[best.Bank] = best
    }
    return best
}

// Cards loads credit‑card information from a local file.
// Format: each line is "Bank BillingDate/LastDate".
// Example: "AgriculturalBank 1/26"
func (z Zeusro) Cards(t time.Time) []Card {
    // omitted
}
```

**Time‑series fixed point**: the second day after a credit card’s billing date.

**Billing‑date‑plus‑one strategy**: a credit‑card spending strategy that executes on the day after the billing date.

**Maximum‑discount transaction strategy**: for each transaction, choose the payment method that yields the highest discount.

## Basic Type Modeling

Credit cards, transactions, and transaction strategies.

```go
type Card struct {
    Bank        string    // financial institution
    BillingDate time.Time // billing date
    LastDate    time.Time // last repayment date
}

type Deal struct {
    t       time.Time
    Money   float32
    policy  string
    Payment Card
}

type Policy interface {
    Match(d Deal) bool
    Name() string
    MVP(d Deal) Policy
}
```

## Binary‑Search Algorithm Based on Transaction Amount

Credit‑card spending is a way to extend accounts payable. The transaction fee (around 1%) is paid by the merchant.

From the consumer’s perspective, applying for multiple credit cards with different billing dates effectively forms a rotating credit cycle — a kind of personal "perpetual bond."

Small transactions are mainly used to farm bank rewards. For example, Agricultural Bank offers 18 yuan − 0.3 yuan for the day’s first payment after activation; SPD Bank has 16 yuan − 0.01 yuan; GF Bank has n − 0.01 yuan, etc.

Based on personal experience, for payments over 1000 yuan, the best timing is the second day after the billing date — the **optimal time‑series fixed point.**

Therefore, the top‑level algorithm uses a binary decision on the transaction amount:

```go
func (z Zeusro) Pay(deals []Deal) []Deal {
    // follow the rule and find the best policy
    discount := NewDiscountPolicys(DefaultDiscountPolicys)
    for i, deal := range deals {
        if deal.Money > SmallMoney {
            // BillingDatePolicy: spend on the day after billing date
            policy1 := NewBillingDatePolicy(z.Cards(deal.t))
            mvp := policy1.MVP(deal)
            best := mvp.BestCard
            deals[i].Payment = best
            deals[i].policy = policy1.Name()
        } else {
            // Maximum discount strategy: go wherever the discount is highest
            mvp := discount.MVP(deal)
            card := Card{Bank: mvp.Bank}
            deals[i].Payment = card
            deals[i].policy = mvp.Name()
        }
    }
    return deals
}
```

### Billing‑Date‑Plus‑One Strategy

The fundamental tendency is to iterate over all credit cards and choose the one whose billing‑date‑plus‑one is closest.

```go
func (p BillingDatePolicy) MVP(d Deal) BillingDatePolicy {
    if len(p.cards) == 0 {
        return p
    }

    now := d.t
    var bestCard *Card
    var bestDelta time.Duration = time.Hour * 24 * 31 // large initial value

    for i := range p.cards {
        c := &p.cards[i]
        delta := now.Sub(c.BillingDate.AddDate(0, 0, 1))
        if delta > 0 && delta < bestDelta {
            bestDelta = delta
            bestCard = c
        }
    }
    if bestCard != nil {
        p.BestCard = *bestCard
    }
    return p
}
```

### Maximum‑Discount Transaction Strategy

Also called the "reward‑farming algorithm." It is simple: follow the discount.

For example, with Agricultural Bank, after registering for the monthly activity, the first daily consumption of 18 yuan gives a 0.3 yuan discount; SPD Bank requires 16 yuan; GF Bank uses n − 0.01, and so on.

```go
func (p *DiscountPolicys) MVP(d Deal) DiscountPolicy {
    var best DiscountPolicy
    var maxDiscount float32 = 0
    for _, policy := range p.Resource {
        if !policy.Match(d) {
            continue
        }
        if policy.Discount >= maxDiscount {
            continue
        }
        best = policy
        if best.N > 0 {
            maxDiscount = best.Discount
            // reduce resource pool
            best.N--
        }
    }
    if len(best.Bank) > 0 {
        p.Resource[best.Bank] = best
    }
    return best
}
```

[The complete algorithm is in my self‑implemented OOOS](https://github.com/zeusro/system/tree/main/function/local/n/china/hangzhou/alipay).

## 0.3 Yuan per Day — I Will Farm Until Agricultural Bank Collapses

![img](/img/in-post/sheep/bf9328c7d254e46545f7e0f4ae095591.jpg)