
微信支付的策略是基于最后一笔，而支付宝的支付顺序总是瞎搞，无论是自动顺序支付和系统自动匹配，带着明显的平台倾向性。这些都不是我想要的结果。

我决定自己设计一个时间序列信用卡消费策略，完成每一笔信用卡支付。

## 形式逻辑和定义

時間序列：是一組按照時間發生先後順序進行排列的數據點序列。

时间序列对象：基于时间序列的程序语言对象。时间必须是第一成员。

例如：
```go
type Deal struct {
	t       time.Time
	Money   float32
	policy  string
	Payment Card
}
```

时间序列函数：基于时间序列的程序语言函数。时间（或者时间序列对象）必须是第一参数成员。

例如：
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
			//资源池减一
			best.N--
		}
	}
	if len(best.Bank) > 0 {
		p.Resource[best.Bank] = best
	}
	return best
}

// Cards 从本地文件加载信用卡信息，格式是每行 "银行 账单日/最后还款日"。如“农业银行 1/26”
func (z Zeusro) Cards(t time.Time) []Card {
    //省略
}
```

时间序列不动点：信用卡账单日的第二天。

账单日第二天消费策略：在信用卡账单日的第二天信用卡消费策略。

最大交易折扣交易策略：每一笔信用卡支付选取折扣金额最大的交易途径的消费策略。

## 基本类型建模

信用卡、交易、交易策略。

```go
type Card struct {
	Bank        string    //金融机构
	BillingDate time.Time //账单日
	LastDate    time.Time //最后还款日
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

## 基于交易金额的二分算法

信用卡消费是一种延长应付账款的消费。单次交易的交易费用（1%左右）由商家承担。
而从消费者角度考虑，申请多张信用卡，并设置不同的账单日，就相当于循环账期，形成个人的“永续债”。

小额消费主要以薅银行羊毛为主。比如农业银行的18-0.3，浦发银行的16-0.01，广发银行的n-0.01。个人感受是1000元以上的消费，以账单日第二天消费为宜——即尽量在信用卡账单日的第二天消费，为最佳时序不动点。

因此总的入口算法，以消费金额，使用二分法消费：

```go
func (z Zeusro) Pay(deals []Deal) []Deal {
	//follow the rule and find the best policy
	discount := NewDiscountPolicys(DefaultDiscountPolicys)
	for i, deal := range deals {
		if deal.Money > SmallMoney {
			//账单日第二天消费策略 BillingDatePolicy
			policy1 := NewBillingDatePolicy(z.Cards(deal.t))
			mvp := policy1.MVP(deal)
			best := mvp.BestCard
			deals[i].Payment = best
			deals[i].policy = policy1.Name()
		} else {
			//最大交易折扣交易策略 DiscountPolicys
			mvp := discount.MVP(deal)
			card := Card{Bank: mvp.Bank}
			deals[i].Payment = card
			deals[i].policy = mvp.Name()
		}
	}
	return deals
}
```

### 账单日第二天消费策略

基本交易倾向是遍历所有信用卡，尽量接近账单第二日交易。

```go
func (p BillingDatePolicy) MVP(d Deal) BillingDatePolicy {
	if len(p.cards) == 0 {
		return p
	}

	now := d.t
	var bestCard *Card
	var bestDelta time.Duration = time.Hour * 24 * 31 // 极大值

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

### 最大交易折扣交易策略

也叫薅羊毛算法。这个算法很简单，就是哪里有钱去哪里。以农业银行来说，参加每月活动报名之后，日消费第一笔18元减0.3元，浦发银行需要16元，以此类推。

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
			//资源池减一
			best.N--
		}
	}
	if len(best.Bank) > 0 {
		p.Resource[best.Bank] = best
	}
	return best
}
```

[完整算法在我的自己实现的 OOOS 里面](https://github.com/zeusro/system/tree/main/function/local/n/china/hangzhou/alipay)。

## 每天0.3元，我要薅到农行倒闭

![img](/img/in-post/sheep/bf9328c7d254e46545f7e0f4ae095591.jpg)