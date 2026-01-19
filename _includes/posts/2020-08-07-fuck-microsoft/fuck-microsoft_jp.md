私は2011年に`C#`という言語に初めて触れました。当時、学校では`.NET Framework 3.5`のチュートリアルを使用していました。

![image](/img/in-post/fuck-microsoft/history.png)

言語機能だけを見れば、10年前の`C#`は`Java 8`よりはるかに優れていました。残念ながら、ライオンは狼の群れと戦えません。おそらく、最初から検索エンジンに不親切だったこともあり、不運に悩まされてきました。
デビューから18年が経ちましたが、私の意見では、基本的に足踏みをしています。

## エレガントなC#言語

C#のジェネリクスは美しく設計されています。今日まで、Javaは型消去を使ってジェネリクスを実装しており、golangについては、紙の上の議論に過ぎず、まだ実装されていません。

C#ジェネリクス（MSIL）の内部実装はどうなっているか？ - RednaxelaFXの回答 - 知乎
https://www.zhihu.com/question/27634924/answer/40854909

CLR天才論文
https://www.microsoft.com/en-us/research/publication/design-and-implementation-of-generics-for-the-net-common-language-runtime/?from=http%3A%2F%2Fresearch.microsoft.com%2Fpubs%2F64031%2Fdesignandimplementationofgenerics.pdf

## 変化を受け入れるのが好きなMicrosoft

おそらくMicrosoftは変化を受け入れるのが好きなのでしょう。数年ごとに、新しい技術フレームワークのセットを展開するのが好きです。

- language
1. .NET framework
1. .NET core
1. Visual Basic
1. F#

- web
1. ashx
1. ASP
1. ASP.NET WebForm
1. WCF
1. Microsoft Silverlight
1. ASP.NET
1. ASP.NET MVC
1. SignalR 2.0
1. Abp VNext

- desktop
1. WPF
1. Windows Forms

- Mobile
1. Xamarin
1. UWP

構文の観点から見ると、C#は私がこれまでに見た中で最もエレガントな言語です。
[LINQはJava 8のstream APIよりはるかに優れています](http://www.zeusro.com/2018/03/08/linq-vs-stream/)。

しかし、Microsoftは最初から間違った道を歩み、`C#`を`Windows`プラットフォームに強く結びつけることを選択しました。CEOの計画は次のとおりでした：強力な結びつきによって自らの立場を強化し、支配的地位を確立する。

人々は足で投票します。`Windows`であれ`Windows Server`であれ、ライセンスは大きなコストです。当時のMicrosoftは短期的な利益に焦点を当てすぎており、C#の大敗につながりました。

そのため、`Xamarin`は別の道を歩み、.NETによるクロスプラットフォーム実装を提案しました。

その後、Microsoftは深く反省し、オープンソースを受け入れることを決定しました。しかし、`Xamarin`を買収した後でも、統合の道は困難に満ちていました。

Microsoftが2019年のBuildカンファレンスで.NET 5を発表したとき、彼らは明確に述べました：「将来、.NETは1つだけになり、Windows、Linux、macOS、iOS、Android、tvOS、watchOS、WebAssemblyなどをターゲットにできるようになります。」Microsoftは4月に、プレビュー2がリリースされたとき、.NETサイトのトラフィックの50%を既に処理していると発表しました。

しかし、2002年から2019年まで、この17年間は基本的に無駄でした。Microsoftの技術の各反復は、基本的に前方非互換でした。普通の開発者にとって、これはかなりの拷問でした。

そのため、基本的に、Microsoftの技術スタックは、いくつかの方向にしか残っていません：

1. Unity 3Dゲーム開発
1. Microsoftで働く
1. 低コストでメンテナンス不要のアプリケーションの迅速な開発

## 今

もう`C#`を扱うことはありませんが、以前`ASP.NET`で開発していた友人を何人か知っています。そのうちの1人は、2016年に私を何度か食事に招待してくれました。
かなり興味深い経験でした。

![image](/img/in-post/fuck-microsoft/2016-04-21.jpeg)

## 結論

**Microsoftの技術：1.0は完全に使用できず、2.0はまあまあです。3.0？申し訳ありませんが、3.0はありません**。

## 参考リンク

[1]
.NET 5.0プレビュー6リリース：Windows ARM64デバイスをサポート
https://www.cnblogs.com/shanyou/p/13196251.html

[2]
C#
https://zh.wikipedia.org/wiki/C%E2%99%AF

[3]
統一された.NETへの旅
https://www.cnblogs.com/shanyou/p/12921285.html
