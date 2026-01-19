もしあなたが熱心なJava愛好家なら、`Ctrl + W`を押してこのタブを閉じることをお勧めします。

1995年、Sunは正式にJavaを発表し、JDK 1.0をリリースしました。

## 弱い構文

私は2014年にASP.NET MVCから始めました。つまり、C#が私の最初の言語でした。C#の構文は非常にエレガントで、10年前の構文でさえJava 10を完全に圧倒しています。

C#のジェネリクスは美しく設計されています。今日まで、Javaは型消去を使ってジェネリクスを実装しています。

C#のジェネリクスとLINQを組み合わせると、まさに無敵です。対照的に、JavaのStream APIは冗長なだけでなく、制限もたくさんあります。

これについて詳しくは、私の記事をご覧ください：[Java 8 Stream APIとC# LINQ拡張メソッドの比較](http://www.zeusro.com/2018/03/08/linq-vs-stream/)。

## 継母には愛がない

1997年10月、Sunはカリフォルニア州の裁判所で、Java技術契約に違反したとしてMicrosoftを訴え、MicrosoftがJava製品に「不適切な変更」を加え、Java互換製品を提供するという約束に違反したと主張しました。

OracleはSunの既存のハードウェアプラットフォームを活用して、データベース、ミドルウェア、その他の製品をより良く宣伝できると考えています。

[Googleが泣く：Oracleに88億ドルを支払わなければならない！](https://cloud.tencent.com/developer/article/1170732)

2009年にOracleがSunを買収した後、Javaの死刑宣告が既に発表されたと言っても過言ではありません。その後のすべては完全に理解できます。

## 足を縛るプログラミング

もしあなたが私の記事を読んだことがあれば
[How To Do In Java](http://www.bullshitprogram.com/howtodoinjava/)
Java APIがどれほどひどいか理解できるでしょう。これらのひどい部分は婉曲的に「非常に安定している」と呼ばれていますが、より正確には「足を縛るプログラミング」と表現できます。これらの不合理な設計が、この言語の歴史的な技術的負債を構成しています。そして、この問題は解決不可能です。なぜなら、Javaは後方互換性を主張しているからです。

## 脳死JVM

就職活動をしていると、少し高いタイトルのポジションには、すべて同様の説明があることに気づくでしょう：

> JVMを理解し、メモリモデル、クラスローディングメカニズム、一般的なメモリ問題のレビューを含む；
>
> 堅実なJavaの基礎、IO、マルチスレッド、コレクション、その他のコア原則に精通し、JVMについてある程度理解している；
> 

インターネット専門家の誇りは、技術革新にあり、技術を使って社会のニーズを満たすことにあるべきだと思います。言語があなたに要求することを満たすことではありません。

言語はツールであり、最終的には商業/ビジネス価値に奉仕します。リソース効率の観点から、Javaは問題のある言語です（メモリを大量に消費し、起動が遅い）。しかし、銀行のような深いポケットを持つ大企業の安定した開発プロジェクトでは、Javaはまだ役立つ可能性があります。しかし、Java JVMは、Dockerに渡されたコンテナ技術の遺産として、その歴史的使命を果たしました。引退する時が来ました。

個人的には、歴史的な遺産問題の後始末をするのは好きではありません。Javaを書くことは、私にとって糞をすくうようなものです。

## 結論

Javaは老いて、もう食べられません。

## 参考リンク

1. [Java 20年：歴史と未来](https://www.infoq.cn/article/2015/05/java-20-history-future)
1. [JVMシリーズ（1）：Javaクラスローディングメカニズム](http://www.ityouknow.com/jvm/2017/08/19/class-loading-principle.html)
1. [待って、Javaにはメモリリークがあるの？](http://www.ityouknow.com/java/2019/05/23/memory-leak.html)
2. [GoはJavaに取って代わり、次のエンタープライズプログラミング言語になるか？](https://www.infoq.cn/article/QC4yNPx8YeIfaKiE*2DS)
3. [Javaは老いている、まだ食べられるか？](https://www.infoq.cn/article/is-java-out-of-date)
4. [Javaには値型があるか？](http://www.yinwang.org/blog-cn/2016/06/08/java-value-type)
5. [攻撃するJava - クラウドネイティブ進化](https://yq.aliyun.com/articles/718894)
6. [Sun-Microsoft裁判：予備的差し止め命令](https://www.washingtonpost.com/wp-srv/business/longterm/microsoft/documents/sunruling.htm)
1. [Java誕生の背景](https://blog.csdn.net/coslay/article/details/46675063)
