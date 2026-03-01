以前用EF的时候，由于where的时候有Expression<Func<T>>和Func<T>两种查询条件，误用了Func<T>那个重载，后来还想通过func创建查询来着，不过失败了，导致了全表查询，真是无语。国内的人答的比较言简意赅(其实我觉得讲的不好).还是老外讲的明白点。

翻译过来吧，就是说Func<T>是方法的委托，而Expression<Func<T>>是拉姆达表达式树。这个树状结构描述了各种各样恶心的参数(如下图所示).我们可以用Expression.Compile做成一个委托或者编译成sql(EF). 

```csharp
Expression<Func<int>> myExpression = () => 10;
```

其实吧， 多用一下你就知道了.Func<T>用的还蛮多的，当时就是用来运行泛化的方法的，而Expression<Func<T>>用在动态查询拼接的时候比较多，比如 (And和or，拼接多条表达式树).

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

表达式树恶心的地方，我写一个orderby给你看看。

```csharp
public static IQueryable<TEntity> OrderBy<TEntity>(this IQueryable<TEntity> source, string orderByProperty, bool desc)
{
    string command = desc ? "OrderByDescending" : "OrderBy";
    var type = typeof(TEntity);//实体的类型
    var property = type.GetProperty(orderByProperty);
    var parameter = Expression.Parameter(type, "o");
    var propertyAccess = Expression.MakeMemberAccess(parameter, property);
    var orderByExpression = Expression.Lambda(propertyAccess, parameter);
    var resultExpression = Expression.Call(typeof(Queryable), command, new Type[] { type, property.PropertyType },
                                  source.Expression, Expression.Quote(orderByExpression));
    return source.Provider.CreateQuery<TEntity>(resultExpression);
}
```

动态linq是需要反射的。而且这种写法不利于调试。因为你特么完全不知道生成的什么鬼，除非你对这玩意真的很熟。好吧，你赢了。

## 参考链接:

1. [Why would you use Expression<Func<T>> rather than Func<T>?](https://stackoverflow.com/questions/793571/why-would-you-use-expressionfunct-rather-than-funct)
2. [Entity Framework - Func引起的数据库全表查询](https://www.cnblogs.com/zeusro/p/4474981.html)
3. [通过已有Func构造Expression表达式问题](https://www.cnblogs.com/zeusro/p/4474981.html)
