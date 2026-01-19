このトピックに関する資料は数え切れません。この記事は私自身の参考用です。

```java

    static String a() {
        try {
            throw new RuntimeException("a");
        } catch (RuntimeException e) {
            return "d";
        } catch (Exception e) {
            return "b";
        } finally {
            return "c";
        }
//        return "d";
    }
```

このコードは最終的に"c"を返します。`finally`は常に実行されるためです。これはC#とは少し異なります。だから覚えておいてください、`finally`は一般的にリソースのクリーンアップ用です—ここで値を返さないでください。

参考リンク：
1. [Java言語の再認識—例外（Exception）](https://blog.csdn.net/xialei199023/article/details/63251277)
1. [Java例外処理メカニズムの深い理解](https://blog.csdn.net/hguisu/article/details/6155636)
1. [Java例外処理とその応用](https://www.ibm.com/developerworks/cn/java/j-lo-exception/index.html)
1. [Java例外処理の誤解と経験のまとめ](https://www.ibm.com/developerworks/cn/java/j-lo-exception-misdirection/)
1. []()
