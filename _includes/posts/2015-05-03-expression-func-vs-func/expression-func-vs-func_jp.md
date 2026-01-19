以前EFを使っていた時、whereにはExpression<Func<T>>とFunc<T>の2種類のクエリ条件がありました。Func<T>のオーバーロードを誤って使用し、後でfuncを通じてクエリを作成しようとしましたが、失敗し、全テーブルクエリが発生しました。本当に困りました。国内の人は簡潔に答えてくれましたが（実は説明が良くないと思います）、外国人はもっと明確に説明してくれました。

翻訳すると、Func<T>はメソッドのデリゲートであり、Expression<Func<T>>はラムダ式ツリーです。このツリー構造は様々なパラメータを記述します（下図参照）。Expression.Compileを使用してデリゲートを作成するか、SQL（EF）にコンパイルできます。

```csharp
Expression<Func<int>> myExpression = () => 10;
```

実際、もっと使えば分かります。Func<T>はかなり使われており、主に汎用メソッドを実行するために使用されますが、Expression<Func<T>>は動的クエリの連結（AndとOr、複数の式ツリーの連結など）でより多く使用されます。

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

式ツリーの厄介な部分、orderbyの例を見せます：

```csharp
public static IQueryable<TEntity> OrderBy<TEntity>(this IQueryable<TEntity> source, string orderByProperty, bool desc)
{
    string command = desc ? "OrderByDescending" : "OrderBy";
    var type = typeof(TEntity);//エンティティの型
    var property = type.GetProperty(orderByProperty);
    var parameter = Expression.Parameter(type, "o");
    var propertyAccess = Expression.MakeMemberAccess(parameter, property);
    var orderByExpression = Expression.Lambda(propertyAccess, parameter);
    var resultExpression = Expression.Call(typeof(Queryable), command, new Type[] { type, property.PropertyType },
                                  source.Expression, Expression.Quote(orderByExpression));
    return source.Provider.CreateQuery<TEntity>(resultExpression);
}
```

動的LINQにはリフレクションが必要です。そして、この書き方はデバッグに適していません。生成されるものが何なのか全く分からないからです。このことに本当に精通していない限り。まあ、あなたの勝ちです。

## 参考リンク:

1. [Why would you use Expression<Func<T>> rather than Func<T>?](https://stackoverflow.com/questions/793571/why-would-you-use-expressionfunct-rather-than-funct)
2. [Entity Framework - Func引起的数据库全表查询](https://www.cnblogs.com/zeusro/p/4474981.html)
3. [通过已有Func构造Expression表达式问题](https://www.cnblogs.com/zeusro/p/4474981.html)
