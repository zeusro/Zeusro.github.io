![image](/img/sticker/p.jpg)

今日は2020-03-17、皆さんに画期的なメタプログラミング開発テクニックを紹介します：**面向调皮开发（皮向き開発）**

私たちの中学の教科書の良き友である魯迅は、かつてこう言ったことはありませんでした：
> 非调皮无以明志，非滑稽无以致远（皮肉でなければ志を明らかにできず、滑稽でなければ遠くに至れない）

![image](/img/sticker/luxun.jpg)

21世紀は生物（皮肉）の世紀であり、**面向调皮开发**を理解する者だけが、世人皆酔い唯我独醒（世の中は皆酔っているが、私だけが目覚めている）となり、滾滾紅塵（激しい世の中）の中で迅速に淘汰されることができる。

## コードを書く間違った姿勢

1. 完璧な内部ヘルスチェックメカニズムを備える
1. ブランチをマージする前に2人以上の`code reviewer`を配置
1. 正式更新前に完全なテスト環境を構築
1. テストカバレッジを80%以上にする
1. 毎回の更新リリースでグレーリリースを使用
1. rootでサーバーを管理・運用しない
1. コンピュータ基礎がしっかりしたエンジニアを雇用
1. 基盤依存（Redis、MySQL）の可用性を99.99%保証
1. `sudo rm -rf /`を使用してサーバーをアップグレードしない

もし**面向调皮開発者**、**面向调皮管理者**、**面向调皮XX**になりたいなら、これらの悪習をすべて取り除く必要がある。

## コードを書く正しい姿勢

![image](/img/p-programming/code.jpg)

風清揚はかつて言った：
> 「単に武学の面から見れば、これらの魔教長老たちも真に上級武学の門を覗いたとは言えない。彼らは理解していない。招数は死んでいて、発招する人は生きている。死んだ招数がどんなに巧妙に破られても、生きている招数に遭遇すれば、縛手縛脚（手も足も出ない）となり、ただ人に屠戮されるだけだ。この『活』という字をしっかり覚えておけ。招を学ぶ時は活学し、招を使う時は活使する。もし拘泥不化（こだわりすぎて変化しない）なら、何千万手の絶招を練習しても、真の高手に遭遇すれば、結局は完全に破られてしまう。

![image](/img/p-programming/another.jpg)

風清揚はまた言った：

> 「大丈夫の行動は、好きなようにすればいい。行雲流水（自然のまま）、任意所至（思うままに）、何の武林規矩、門派教条も、全部クソ食らえだ！」

`#define TRUE FALSE`

覚えておけ、早期最適化にノーと言い、最適化が必要ならすぐに逃げろ。

![image](/img/p-programming/thread.png)

## フロントエンドをやる正しい姿勢

![image](/img/p-programming/jq.jpg)

## バグを書く正しい姿勢

![image](/img/p-programming/hand-over.jpg)

バグを書いても問題ない、自分のものでなければ。

もしあなたが書いたコードに問題があれば、同僚のコンピュータを`hack`し、`git rebase`でリポジトリのコミット履歴を書き換え、すべての責任を他人に押し付ける。

## テストをやる正しい姿勢

![image](/img/p-programming/test.gif)

## オープンソースコミュニティの正しい姿勢

自分のオープンソースプロジェクトは、「**皮**」という文字を強調し、このプロジェクトは面白くなければならない。例えば：
1. [動的計画法で浮気男が他人の恋人を奪う](https://www.zeusro.com/2020/03/14/dynamic-optimization/)
1. [人為的に帯域幅均衡状態を作る](https://github.com/p-program/common-bandwidth-auto-switch)ことで阿里雲の共有帯域幅を儲からなくする。
1. `dnspod`のウェブサイトがひどすぎるので、[油猴プラグインを開発してdnspodを改造](https://www.zeusro.com/2019/07/05/mydnspod/)し、最後に騰訊のHRにメールを送って、彼らの製品設計を批判する

### pull requestの正しい姿勢

`pull request`も、「**皮**」という文字を強調する必要がある

覚えておけ、`pull request`は`reviewers`（通常はあなたの上司）に復讐する最高の機会だ。全力を尽くして、コードとドキュメントに必死に罠を仕掛ける。例えば

1. `int64`であるべき変数を`int32`で表現し、この問題を時間の経過とともに徐々に出現させる
1. 創造的なスペルミス
1. `UTF-8`の文字セットを最大限に活用し、非英語文字、ASCII文字を使用
1. 可能な限りモジュール化し、util、interface、service implement、web front-end、web back-endをそれぞれ`git`の`submodule`にし、各`submodule`間に菱形依存関係を作る。とにかくトップレベルのwebプロジェクトがいつ動くかは神のみぞ知る。プロジェクトが多ければ、KPIが得られる。
1. `Java`プログラミングを堅持し、[阿里巴巴Java開発マニュアル](https://github.com/alibaba/p3c)のいずれのルールにも違反する
1. 製品ドキュメントには製品に関する詳細を一切書かない（これは製品が破壊されないように保護するため！）
1. 外部メンテナンス請負業者を雇う傾向を阻害するため、コード中に他の同業ソフトウェア会社への攻撃と中傷を散布し、特にあなたの仕事を引き継ぐ可能性のある会社を対象とする

自動的に難読化されたコードは神に見せるためのもので、私たちのコードを保護する。たとえ競合他社の手に落ちても、まったく慌てない。あなたが書くバグが十分に奇妙であれば、会社は簡単にあなたを解雇できない！競合他社もあなたに敬意を払う！

**面向调皮開発**は、結果ではなく思考を重視する。真面目な顔ででたらめを言い、バグだらけのコードを書くことを学ぶ。

もし誰かがあなたを疑問視したら、この画像を送る：

![image](/img/p-programming/chicken.png)

### `issue`を処理する正しい姿勢

他人が何を尋ねても、まず[質問の智慧](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way/blob/master/README-zh_CN.md)を学ばせる

もし彼が学んだら、自分で問題を解決させる。

### `code review`の正しい姿勢

彼がどんなコードを書いても、まずテストカバレッジを99.99%にするよう要求する。もし彼が達成したら、直接`pull request`を閉じ、このプロジェクトはもうメンテナンスするつもりはないと伝える。

参考

1. [hexo Chart](https://github.com/cloudnativeapp/charts/pull/33)
1. [如何编写无法维护的代码](https://coderlmn.github.io/frontEndCourse/unmaintainable.html)
1. [Update README-zh_Hans.md](https://github.com/zxystd/IntelBluetoothFirmware/pull/61)

## サーバー運用の正しい姿勢

![](/img/p-programming/rm.jpg)

1. `sudo rm -rf /`
1. プラグを抜く
1. プラグを差す

## データベース管理の正しい姿勢

![image](/img/p-programming/delete-db.gif)

## Kubernetes管理者の正しい姿勢

![image](/img/p-programming/rm.gif)

```bash
kubectl delete namespace default --grace-period=0 --force
```

## 結語

信じてくれ、**面向调皮開発**の真髄を体験した後、間もなく降職減薪（降格・減給）、CAO（首席背鍋官、最高責任者）になり、拘留所に出入りし、検察官とつながり、人生のどん底に堕ちる。収入は半減し、敵は倍増し、鉄窓生活は夢ではない！

![image](/img/p-programming/CAO.png)

[最近ドメインを買った](http://www.bullshitprogram.com/)、皆さんからお金を送ってください。

## 参考リンク

1. [風清揚：另有高処比天高](https://baike.baidu.com/tashuo/browse/content?id=465f421a9dfaa9bbf1492227&lemmaId=7056998&fromLemmaModule=pcBottom)
1. [Ask HN: What's the largest amount of bad code you have ever seen work?](https://news.ycombinator.com/item?id=18442637)
1. [is there an award for ugliest code?](https://www.reddit.com/r/ProgrammerHumor/comments/9xuhyj/is_there_an_award_for_ugliest_code/)
