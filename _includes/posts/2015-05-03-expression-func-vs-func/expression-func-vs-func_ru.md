Когда я использовал EF (Entity Framework), для where было два типа условий запроса: Expression<Func<T>> и Func<T>. Я ошибочно использовал перегрузку Func<T>, а затем попытался создать запросы через func, но это не удалось, что привело к полному запросу таблицы. Это было действительно неприятно. Люди в Китае отвечали довольно кратко (на самом деле я думаю, что они объяснили это не очень хорошо). Иностранцы объяснили это более ясно.

Переводя: Func<T> - это делегат метода, а Expression<Func<T>> - это дерево лямбда-выражений. Эта древовидная структура описывает различные параметры (как показано на рисунке ниже). Мы можем использовать Expression.Compile для создания делегата или компиляции его в SQL (EF).

```csharp
Expression<Func<int>> myExpression = () => 10;
```

На самом деле, вы поймете, как только будете использовать это больше. Func<T> используется довольно часто, в основном для запуска обобщенных методов, в то время как Expression<Func<T>> используется больше для динамической конкатенации запросов, например (And и Or, конкатенация нескольких деревьев выражений).

```csharp
public static class PredicateBuilder
{
    public static Expression<Func<T, bool>> And<T>(this Expression<Func<T, bool>> first, Expression<Func<T, bool>> second)
    {
        return first.Compose<T>(second, new Func<Expression, Expression, Expression>(Expression.And));
    }

    private static Expression<Func<T, bool>> Compose<T>(this Expression<Func<T, bool>> first, Expression<Func<T, bool>> second, Func<Expression, Expression, Expression> merge)
    {
        Expression expression = new ParameterRebinder(second.Parameters[0], first.Parameters[0]).Visit(second.Body);
        return Expression.Lambda<Func<T, bool>>(merge(first.Body, expression), first.Parameters);
    }

    public static Expression<Func<T, bool>> False<T>()
    {
        return item => false;
    }

    public static Expression<Func<T, bool>> Not<T>(this Expression<Func<T, bool>> predicate)
    {
        return Expression.Lambda<Func<T, bool>>(Expression.Not(predicate.Body), predicate.Parameters);
    }

    public static Expression<Func<T, bool>> Or<T>(this Expression<Func<T, bool>> first, Expression<Func<T, bool>> second)
    {
        return first.Compose<T>(second, new Func<Expression, Expression, Expression>(Expression.Or));
    }

    public static Expression<Func<T, bool>> True<T>()
    {
        return item => true;
    }

    private sealed class ParameterRebinder : ExpressionVisitor
    {
        private readonly ParameterExpression m_From;
        private readonly ParameterExpression m_To;

        public ParameterRebinder(ParameterExpression from, ParameterExpression to)
        {
            this.m_From = from;
            this.m_To = to;
        }

        protected override Expression VisitParameter(ParameterExpression node)
        {
            if (node == this.m_From)
            {
                node = this.m_To;
            }
            return base.VisitParameter(node);
        }
    }
}
```

Раздражающая часть деревьев выражений, позвольте показать вам пример orderby:

```csharp
public static IQueryable<TEntity> OrderBy<TEntity>(this IQueryable<TEntity> source, string orderByProperty, bool desc)
{
    string command = desc ? "OrderByDescending" : "OrderBy";
    var type = typeof(TEntity);//Тип сущности
    var property = type.GetProperty(orderByProperty);
    var parameter = Expression.Parameter(type, "o");
    var propertyAccess = Expression.MakeMemberAccess(parameter, property);
    var orderByExpression = Expression.Lambda(propertyAccess, parameter);
    var resultExpression = Expression.Call(typeof(Queryable), command, new Type[] { type, property.PropertyType },
                                  source.Expression, Expression.Quote(orderByExpression));
    return source.Provider.CreateQuery<TEntity>(resultExpression);
}
```

Динамический LINQ требует рефлексии. И этот стиль написания не способствует отладке. Потому что вы понятия не имеете, что черт возьми генерируется, если только вы не очень хорошо знакомы с этим. Ну, вы выиграли.

## Ссылки:

1. [Why would you use Expression<Func<T>> rather than Func<T>?](https://stackoverflow.com/questions/793571/why-would-you-use-expressionfunct-rather-than-funct)
2. [Entity Framework - Func引起的数据库全表查询](https://www.cnblogs.com/zeusro/p/4474981.html)
3. [通过已有Func构造Expression表达式问题](https://www.cnblogs.com/zeusro/p/4474981.html)
