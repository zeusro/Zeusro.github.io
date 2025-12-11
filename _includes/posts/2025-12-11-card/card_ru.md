Стратегия WeChat Pay основана на «последней транзакции», тогда как порядок платежей Alipay всегда хаотичен. Автоматическое списание и системное сопоставление демонстрируют явный платформенный перекос. Всё это не соответствует тому, что мне нужно.

Поэтому я решил разработать собственную стратегию расходования кредитных карт на основе временных рядов, чтобы контролировать каждую операцию.

## Формальная логика и определения

**Временной ряд** — последовательность точек данных, упорядоченных по времени.

**Объект временного ряда** — объект языка программирования, основанный на временном ряде. Время обязательно является первым полем.

Пример:
```go
type Deal struct {
	t       time.Time
	Money   float32
	policy  string
	Payment Card
}
```

**Функция временного ряда** — это функция, основанная на временных данных. Параметр времени (или объект временного ряда) должен быть первым параметром.

Например:
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
			// уменьшение ресурсного пула
			best.N--
		}
	}
	if len(best.Bank) > 0 {
		p.Resource[best.Bank] = best
	}
	return best
}

// Cards загружает информацию о кредитных картах из локального файла.
// Формат: каждая строка — «банк дата_биллинга/дата_погашения».
// Например: «ABC 1/26»
func (z Zeusro) Cards(t time.Time) []Card {
    // опущено
}
```

**Неподвижная точка временного ряда** — второй день после даты выписки кредитной карты.

**Стратегия расходования на второй день после даты выписки** — стратегия использования кредитных карт на следующий день после даты выписки.

**Стратегия максимальной скидки** — для каждой операции выбирается способ оплаты с наибольшей скидкой.

## Моделирование базовых типов

Кредитные карты, транзакции, стратегии транзакций.

```go
type Card struct {
	Bank        string    // финансовая организация
	BillingDate time.Time // дата выписки
	LastDate    time.Time // крайний срок погашения
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

## Бинарный алгоритм на основе суммы транзакции

Расходование по кредитной карте — это форма продления кредиторской задолженности. Комиссия за транзакцию (около 1%) оплачивается продавцом.

С точки зрения потребителя, оформление нескольких кредитных карт с разными датами выписки создаёт цикл вращающихся долгов — персональный «вечный долг» (perpetual bond).

Мелкие покупки в основном используются для получения бонусов банков. Например:

- ABC: 18 – 0.3  
- SPDB: 16 – 0.01  
- CGB: n – 0.01  

По моему опыту, для расходов более 1000 юаней оптимально платить **на второй день после даты выписки** — это оптимальная неподвижная точка временного ряда.

Поэтому общий алгоритм определяет стратегию на основе бинарного разбиения суммы:

```go
func (z Zeusro) Pay(deals []Deal) []Deal {
	// follow the rule and find the best policy
	discount := NewDiscountPolicys(DefaultDiscountPolicys)
	for i, deal := range deals {
		if deal.Money > SmallMoney {
			// стратегия расходования на второй день после биллинга
			policy1 := NewBillingDatePolicy(z.Cards(deal.t))
			mvp := policy1.MVP(deal)
			best := mvp.BestCard
			deals[i].Payment = best
			deals[i].policy = policy1.Name()
		} else {
			// стратегия максимальной скидки
			mvp := discount.MVP(deal)
			card := Card{Bank: mvp.Bank}
			deals[i].Payment = card
			deals[i].policy = mvp.Name()
		}
	}
	return deals
}
```

### Стратегия расходования на второй день после даты выписки

Основной принцип — перебрать все кредитные карты и выбрать ту, чья дата «выписка + 1 день» наиболее близка к текущему времени.

```go
func (p BillingDatePolicy) MVP(d Deal) BillingDatePolicy {
	if len(p.cards) == 0 {
		return p
	}

	now := d.t
	var bestCard *Card
	var bestDelta time.Duration = time.Hour * 24 * 31 // большое значение

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

### Стратегия максимальной скидки

Называется также алгоритмом «снятия сливок» — идти туда, где дают выгоду.

Например, в ABC после регистрации в ежемесячной акции первая ежедневная операция на 18 юаней даёт скидку 0.3 юаня.  
SPDB — 16 юаней.  
И так далее.

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
			// уменьшение ресурсного пула
			best.N--
		}
	}
	if len(best.Bank) > 0 {
		p.Resource[best.Bank] = best
	}
	return best
}
```

[Полный алгоритм находится в моём собственном проекте OOOS](https://github.com/zeusro/system/tree/main/function/local/n/china/hangzhou/alipay)。

## Каждый день 0.3 юаня — буду получать, пока ABC не развалится

![img](/img/in-post/sheep/bf9328c7d254e46545f7e0f4ae095591.jpg)