![image](/img/sticker/p.jpg)

今日は2020-03-17です。画期的なメタプログラミング開発テクニックを紹介します：**P指向プログラミング**

中学校の教科書の良き友である魯迅は、かつてこう言っていませんでした：
> いたずらなくして志を明らかにすることはできず、滑稽なくして遠くに到達することはできない

![image](/img/sticker/luxun.jpg)

21世紀は生物学（いたずら）の世紀です。**P指向プログラミング**を理解して初めて、世の中が酔っている中で一人だけ目覚め、激しい現実の中で迅速に排除されることができます。

## コードを書く間違った方法

1. 包括的な内部ヘルスチェックメカニズムを装備する
1. ブランチをマージする前に2人以上の`code reviewer`を配置する
1. 正式な更新前に完全なテスト環境を構築する
1. テストカバレッジが80%以上
1. 更新のデプロイごとにグレースケールを使用する
1. rootを使用して運用サーバーを管理しない
1. コンピュータの基礎がしっかりしたエンジニアを雇う
1. 基盤インフラ依存関係（Redis、MySQL）の可用性を99.99%保証する
1. `sudo rm -rf /`を使用してサーバーのアップグレードを完了しない

**P指向開発者**、**P指向管理者**、**P指向XX**になりたい場合は、これらの悪い習慣をすべて取り除く必要があります。

## コードを書く正しい方法

![image](/img/p-programming/code.jpg)

風清揚はかつて言いました：
> 「武学だけを見れば、これらの魔教長老たちは上級武学の門を真に覗き見たとは言えません。彼らは理解していません。技は死んでいますが、それを実行する人は生きています。死んだ技がどれほど巧妙に破られても、生きている技に遭遇すると、必然的に手足を縛られ、ただ屠殺されるだけです。この「生きている」という言葉をしっかりと覚えておく必要があります。技を柔軟に学び、技を柔軟に使用します。硬直して柔軟性がない場合、何千万もの究極の技を練習しても、真の達人に遭遇すると、最終的には完全に破られます。

![image](/img/p-programming/another.jpg)

風清揚はまた言いました：

> 「真の男は好きなように行動し、雲や水のように流れ、どこへでも行きます。武術のルール、宗派の教義、それらはすべてクソです！」

`#define TRUE FALSE`

覚えておいてください。時期尚早な最適化にノーと言い、最適化が必要な場合は、すぐに逃げてください。

![image](/img/p-programming/thread.png)

## フロントエンドを行う正しい方法

![image](/img/p-programming/jq.jpg)

## バグを書く正しい方法

![image](/img/p-programming/hand-over.jpg)

バグを書いても問題ありません。自分のものでない限り。

書いたコードに問題がある場合は、同僚のコンピュータを`hack`し、`git rebase`を使用してリポジトリのコミット履歴を書き直し、他の人にすべての責任を負わせます。

## テストを行う正しい方法

![image](/img/p-programming/test.gif)

## オープンソースコミュニティの正しい方法

独自のオープンソースプロジェクトは「**いたずら**」の特徴を強調する必要があります。プロジェクトは興味深いものである必要があります。例えば：
1. [動的計画法を使用して浮気者に他人のパートナーを盗ませる](https://www.zeusro.com/2020/03/14/dynamic-optimization/)
1. [帯域幅の平衡状態を人為的に作成](https://github.com/p-program/common-bandwidth-auto-switch)して、阿里云の共有帯域幅がお金を稼げないようにする
1. `dnspod`のウェブサイトが壊れすぎていることを嫌い、[dnspodを変更するTampermonkeyプラグインを開発](https://www.zeusro.com/2019/07/05/mydnspod/)、最後にTencentのHRにメールを送って製品設計について文句を言う

### プルリクエストの正しい方法

`pull request`も「**いたずら**」の特徴を強調する必要があります

覚えておいてください。`pull request`は`reviewers`（これらの人々は通常あなたの上司です）に復讐する最良の機会です。コードとドキュメントに全力で穴を掘ります。例えば：

1. `int64`であるべき変数に`int32`を使用し、問題が時間の経過とともに徐々に現れるようにする
1. 創造的なスペルミス
1. `UTF-8`文字セットを最大限に活用し、非英語文字、ASCII文字を使用する
1. 可能な限りモジュール化し、util、interface、service implement、web front-end、web back-endをすべて`git`の`submodule`にし、各`submodule`間にダイヤモンド依存関係がある。トップレベルのWebプロジェクトがいつ実行できるか誰が知っているか。プロジェクトが多ければ多いほど、KPIが増えます。
1. `Java`プログラミングの使用を堅持し、[阿里巴巴Java開発マニュアル](https://github.com/alibaba/p3c)のすべてのルールに違反する
1. 製品ドキュメントに製品に関連する詳細を書かない（これは製品が破壊されないように保護するためです！）
1. 外部メンテナンス請負業者を雇う傾向を妨げるために、コード内に他の同業ソフトウェア会社、特にあなたの仕事を置き換える可能性のある会社に対する攻撃と中傷を散りばめることができます

自己難読化コードは神が見るためのものです。コードをよく保護してください。競合他社の手に落ちても、まったくパニックになりません。書いたバグが十分に奇妙であれば、会社は簡単にあなたを解雇することを敢えてしません！競合他社もあなたを尊敬します！

**P指向プログラミング**は結果ではなく、アイデアに焦点を当てます。真剣にでたらめを話し、バグだらけのコードを書くことを学びます。

誰かがあなたに質問した場合、この画像を送信してください：

![image](/img/p-programming/chicken.png)

### `issue`を処理する正しい方法

誰かがどんな質問をしても、まず[質問の賢い方法](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way/blob/master/README-zh_CN.md)を読ませてください

彼らがそれを学んだら、自分で問題を解決させてください。

### `code review`の正しい方法

どんなコードを書いても、まず99.99%のテストカバレッジを達成させてください。彼らがそれを達成したら、直接`pull request`を閉じ、このプロジェクトはもうメンテナンスする予定がないと伝えてください。

参考文献

1. [hexo Chart](https://github.com/cloudnativeapp/charts/pull/33)
1. [保守不可能なコードの書き方](https://coderlmn.github.io/frontEndCourse/unmaintainable.html)
1. [Update README-zh_Hans.md](https://github.com/zxystd/IntelBluetoothFirmware/pull/61)

## サーバー運用の正しい方法

![](/img/p-programming/rm.jpg)

1. `sudo rm -rf /`
1. プラグを抜く
1. プラグを差し込む

## データベース管理の正しい方法

![image](/img/p-programming/delete-db.gif)

## Kubernetes管理者の正しい方法

![image](/img/p-programming/rm.gif)

```bash
kubectl delete namespace default --grace-period=0 --force
```

## 結語

信じてください。**P指向プログラミング**の真の意味を体験した後、降格と給与カット、CAO（最高謝罪責任者）になる、拘留所への出入り、検察官との関係、人生の底に落ちるまで、それほど長くはかかりません。収入は半分に、敵は倍に、刑務所生活は夢ではありません！

![image](/img/p-programming/CAO.png)

[最近ドメインを購入しました](http://www.bullshitprogram.com/)。皆さん、お金を送ってください。

## 参考リンク

1. [風清揚：天より高い高みがある](https://baike.baidu.com/tashuo/browse/content?id=465f421a9dfaa9bbf1492227&lemmaId=7056998&fromLemmaModule=pcBottom)
1. [Ask HN: What's the largest amount of bad code you have ever seen work?](https://news.ycombinator.com/item?id=18442637)
1. [is there an award for ugliest code?](https://www.reddit.com/r/ProgrammerHumor/comments/9xuhyj/is_there_an_award_for_ugliest_code/)
