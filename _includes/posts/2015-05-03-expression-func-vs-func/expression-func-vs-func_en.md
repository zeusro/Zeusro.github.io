When I was using EF (Entity Framework), there were two types of query conditions for where: Expression<Func<T>> and Func<T>. I mistakenly used the Func<T> overload, and later tried to create queries through func, but it failed, resulting in a full table query. It was really frustrating. People in China answered quite concisely (I actually think they didn't explain it well). Foreigners explained it more clearly.

To translate: Func<T> is a method delegate, while Expression<Func<T>> is a lambda expression tree. This tree structure describes various parameters (as shown in the figure below). We can use Expression.Compile to create a delegate or compile it into SQL (EF).

```csharp
Expression<Func<int>> myExpression = () => 10;
```

Actually, you'll understand once you use it more. Func<T> is used quite a lot, mainly for running generalized methods, while Expression<Func<T>> is used more for dynamic query concatenation, such as (And and Or, concatenating multiple expression trees).

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

The annoying part about expression trees, let me show you an orderby example:

```csharp
public static IQueryable<TEntity> OrderBy<TEntity>(this IQueryable<TEntity> source, string orderByProperty, bool desc)
{
    string command = desc ? "OrderByDescending" : "OrderBy";
    var type = typeof(TEntity);//Entity type
    var property = type.GetProperty(orderByProperty);
    var parameter = Expression.Parameter(type, "o");
    var propertyAccess = Expression.MakeMemberAccess(parameter, property);
    var orderByExpression = Expression.Lambda(propertyAccess, parameter);
    var resultExpression = Expression.Call(typeof(Queryable), command, new Type[] { type, property.PropertyType },
                                  source.Expression, Expression.Quote(orderByExpression));
    return source.Provider.CreateQuery<TEntity>(resultExpression);
}
```

Dynamic LINQ requires reflection. And this writing style is not conducive to debugging. Because you have no idea what the hell is being generated, unless you're really familiar with this stuff. Well, you win.

## Reference Links:

1. [Why would you use Expression<Func<T>> rather than Func<T>?](https://stackoverflow.com/questions/793571/why-would-you-use-expressionfunct-rather-than-funct)
2. [Entity Framework - Func引起的数据库全表查询](https://www.cnblogs.com/zeusro/p/4474981.html)
3. [通过已有Func构造Expression表达式问题](https://www.cnblogs.com/zeusro/p/4474981.html)
