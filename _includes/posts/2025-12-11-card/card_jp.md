WeChat Pay の戦略は「最後の一筆」に基づいていますが、Alipay の支払順序は常に混乱しており、自動順序決済やシステム自動マッチングにおいても明らかなプラットフォーム側のバイアスが存在します。これらは私が望む結果ではありません。

そこで私は、自分自身で時間系列に基づくクレジットカード消費戦略を設計し、すべてのクレジットカード決済をコントロールすることにしました。

## 形式論理と定義

**時間序列（Time Series）**：時間の発生順に並べられたデータ点の集合。

**時間序列オブジェクト**：時間系列に基づくプログラミング言語のオブジェクト。時間は必ず最初のメンバーであること。

例：
```go
type Deal struct {
	t       time.Time
	Money   float32
	policy  string
	Payment Card
}
```

**時間系列関数（Time-series function）**：時間系列に基づく関数。時間（または時間系列オブジェクト）が必ず最初の引数である。

例：
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
			//資源プールを1減らす
			best.N--
		}
	}
	if len(best.Bank) > 0 {
		p.Resource[best.Bank] = best
	}
	return best
}

// Cards はローカルファイルからクレジットカード情報を読み込む。
// フォーマット：1行につき「銀行名 账单日/最後還款日」。例：「农业银行 1/26」
func (z Zeusro) Cards(t time.Time) []Card {
    //省略
}
```

**時間系列の不動点**：クレジットカードの「账单日（締め日）の翌日」。

**账单日翌日消費戦略**：クレジットカードの締め日の翌日に消費する戦略。

**最大割引消費戦略**：各取引に対して最も割引額が大きい支払方法を選択する戦略。

## 基本タイプモデリング

クレジットカード、取引、取引戦略の定義。

```go
type Card struct {
	Bank        string    //金融機関
	BillingDate time.Time //账单日（締め日）
	LastDate    time.Time //最後還款日（返済期限）
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

## 取引金額に基づく二分アルゴリズム

クレジットカードの消費は「应付账款（未払金）」を延長する行為と言えます。1% 前後の手数料は店舗側が負担します。

消費者の視点では、複数のクレジットカードを申し込み、異なる账单日を設定することで、回転する支払サイクルを作り出し、個人の「永続債（Perpetual bond）」のような仕組みを形成できます。

小額消費は主に「銀行のキャンペーンを最大限利用する」目的で行います。例えば：

- 农业银行：18 元 − 0.3 元
- 浦发银行：16 元 − 0.01 元
- 广发银行：n − 0.01 元

そして、私の実感では、**1000 元を超える支払いについては、账单日翌日の消費が最適**です。すなわち「時間系列の最適不動点」。

したがって上位アルゴリズムは、金額によって二分する方式を採用します：

```go
func (z Zeusro) Pay(deals []Deal) []Deal {
	//follow the rule and find the best policy
	discount := NewDiscountPolicys(DefaultDiscountPolicys)
	for i, deal := range deals {
		if deal.Money > SmallMoney {
			//账单日翌日消費戦略 BillingDatePolicy
			policy1 := NewBillingDatePolicy(z.Cards(deal.t))
			mvp := policy1.MVP(deal)
			best := mvp.BestCard
			deals[i].Payment = best
			deals[i].policy = policy1.Name()
		} else {
			//最大取引割引戦略 DiscountPolicys
			mvp := discount.MVP(deal)
			card := Card{Bank: mvp.Bank}
			deals[i].Payment = card
			deals[i].policy = mvp.Name()
		}
	}
	return deals
}
```

### 账单日翌日消費戦略

基本方針は「全カードを走査し、账单日翌日に最も近いタイミングで決済する」ことです。

```go
func (p BillingDatePolicy) MVP(d Deal) BillingDatePolicy {
	if len(p.cards) == 0 {
		return p
	}

	now := d.t
	var bestCard *Card
	var bestDelta time.Duration = time.Hour * 24 * 31 // 極大値

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

### 最大割引取引戦略

別名「羊毛狩り（ポイント稼ぎ）アルゴリズム」。  
やることは単純で、「割引があるところに行く」だけです。

农业银行の例：

- 月次キャンペーン登録後、1日の最初の 18 元消費：0.3 元割引
- 浦发銀行：16 元
- 以此类推（などなど）

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
			//資源プールを1減らす
			best.N--
		}
	}
	if len(best.Bank) > 0 {
		p.Resource[best.Bank] = best
	}
	return best
}
```

[See OOOS](https://github.com/zeusro/system/tree/main/function/local/n/china/hangzhou/alipay)

## 1日 0.3 元、私は農業銀行が倒れるまで取り続ける

![img](/img/in-post/sheep/bf9328c7d254e46545f7e0f4ae095591.jpg)