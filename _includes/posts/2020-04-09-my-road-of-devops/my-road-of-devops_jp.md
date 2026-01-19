**継続的な最適化**は、私の仕事と生活の唯一のアルゴリズムであり、その1つの現れが`DevOps`です。

今日は、私と`DevOps`の愛憎の歴史について話します。

## 2016〜2018：static Jenkins

16年のとき、私は仕事の効率をどう向上させ、アプリケーションのリリースを反復に追いつかせるかを考えていました。

その時、私はこれが`DevOps`と呼ばれることを知りませんでした。とにかく何でも使いました。最後に`Jenkins`を選択しました。`Jenkins`はプラグインベースの純粋なウォーターフォールCIモデルです。つまり、設定が最も負担の大きい部分です。

![image](/img/road-of-devops/jenkins-1.png)

すべてのプロジェクトで、設定を繰り返す必要がありました（後でテンプレートプロジェクトを作成しましたが、根本的な問題を解決できないことがわかりました）。各プロジェクトの設定には、N個のプラグインが含まれています。内部の`Java`プロジェクトを例に挙げます。

CIプロセス全体は次のように分けられます：

> webhook --> Jenkins build --> docker push

Jenkins buildはさらに細分化できます：

> git pull/clone --> gradle/maven build --> docker build

![image](/img/road-of-devops/jenkins-2.png)

ここでのすべてのステップ、さらにはデータの流れ（たとえば、tagとbranchに基づいてビルドをトリガーする必要があるかどうかを判断する）には、プラグインが必要です。

![branch plugin](/img/road-of-devops/jenkins-3.png)

このプロジェクトを例として、最終的に使用したプラグインは次のとおりです：
1. docker
2. Environment Injector Plugin
3. Gitea（ソースリポジトリはgitea）
4. gradle（ビルドツールはgradle）
5. Mask Passwords（docker loginパスワードをマスクするため）
6. Generic Webhook Trigger Plugin（上図のOptional filterで、入力要件を満たすbranchのみが次のビルドステップをトリガー）

プロジェクト設定に加えて、いくつかのグローバル設定も行う必要があります...

最終的に、`Jenkins`はスーパー航空母艦になり、誰も中に何が入っているかわかりません。残っているのは：

> provider_version=`docker image ls $image1 |grep -Eo '([0-9]{0,2}\.){2}[0-9]+'| head -1`

この最も有用なtag抽出スクリプトだけです、ははは...

### 結論

小規模ビルドシステム（<30のビルドタスク）の最適解

### 関連作業のレビュー

1. [Jenkinsで.NET CI環境をゼロから構築](http://www.zeusro.com/2016/02/26/net-ci/)
2. [Gogs+JenkinsでJavaプロジェクトをビルドし、最後にdocker化](http://www.zeusro.com/2018/08/17/gogs-Jenkins-java-docker/)
3. [kubernetes上でJenkinsを使用](http://www.zeusro.com/2019/10/29/jenkins-on-kubernetes/)

## 2018〜現在：swarm + Concourse

![image](/img/road-of-devops/concourse-1.png)

`Jenkins`がプラグインベースの純粋なウォーターフォール航空母艦であるなら、Concourseはミニマリスト忍者です。

Concourseの最大の利点は、再利用可能なテンプレート設定です。次に、活発なコミュニティも良い点です（少なくとも多くの人が使用していることを示しています）。また、リリースは時々非常に遊び心があり、いくつかの絵文字などが含まれています。

欠点は、breaking changeが多く、dockerで実行するとdocker in dockerになることです。

4.xバージョンでは、docker hung、load15過多などの状況が無数に発生し、その時は再起動するしかありませんでした。非常にイライラしました。この問題は、[5.x](https://github.com/concourse/concourse/releases/tag/v5.0.0)にアップグレードした後、わずかに緩和されました。

![image](/img/road-of-devops/concourse-2.png)

BTW、Concourse自体は分散システムであり、将来的には`Kubernetes`で実行する計画がありますが、現在はまだ[草案](https://github.com/concourse/concourse/pull/5223)です。

![image](/img/road-of-devops/concourse-3.png)

### 結論

2020年3月末に[6.x](https://github.com/concourse/concourse/releases/tag/v6.0.0)バージョンがリリースされました。試す価値があります。

### 関連作業のレビュー
1. [Concourse-CIでmaven/gradleプロジェクトを統合](http://www.zeusro.com/2018/09/02/give-up-concourse-ci/)

## 2020：tektoncd

![image](/img/road-of-devops/devops.png)

実際、`JenkinsX`も試しましたが、その時、`JenkinsX`のドキュメントが少なすぎて、作業がうまくいきませんでした。`JenkinsX`は`Jenkins Blue Ocean`に少し似ており、`serverless`も追加されています。しかし、`static Jenkins`のものを放棄していませんでした。最後に、やや中途半端になりました。

2020/03/11、`JenkinsX`は自(我)(倒)閉を発表しました。

関数型serverlessフレームワーク[knative](https://github.com/knative)も、独自のCI開発を放棄し、`tektoncd`を指すことを発表しました。

2019年3月、私はすでにクラウドプレイヤーとして`tektoncd`を体験していました。その時、モデルの定義はまだ非常に簡単でした。

しかし、今見ると、当時不足していると思っていたビルドキャッシュはすでに追加されています。しかし、2019年に私が提案した：
> CRDを通じてCI/CDを再定義することは大きなハイライトですが、現在ビルドタスクはYAMLファイルを手動で作成することによってのみ作成でき、ビルドタスクが多い場合、クラスター内にこのCI関連のCRDが大量に蓄積され、かなり愚かに感じます。

この問題はうまく解決できませんでした。現在のアプローチは、`Cronjob`を通じて定期的なクリーンアップを実装することです。

### 結論

大きな可能性があり、試す価値があります。

### 関連作業のレビュー

1. [国内サーバーにJenkinsXをインストール](http://www.zeusro.com/2019/03/16/install-Jenkins-X/)
1. [Jenkins-XでJavaアプリケーションをビルド](http://www.zeusro.com/2019/03/16/Jenkins-X-build-Java/)
2. [tektoncdクラウドプレイヤー初体験](http://www.zeusro.com/2019/03/25/tektoncd/)
3. [Please support build cache in PipelineResources](https://github.com/tektoncd/pipeline/issues/2088)
4. [Can't rerun existing completed taskruns or delete completed taskruns automatically](https://github.com/tektoncd/pipeline/issues/1302)
5. [Introduce runHistoryLimit](https://github.com/tektoncd/pipeline/issues/2332)

### 参考リンク

1. [Jenkins XがTektonを選択｜Jenkinsを廃止](https://mp.weixin.qq.com/s/n_AfL63DQsOXZLsw08Iwbg)
1. [Jenkins X ❤ Tekton](https://jenkins-x.io/blog/2020/03/11/tekton/)

## 2018.06〜現在：Kubernetes

`Kubernetes`については、すでに無数のトピックを発表しています。18年のとき、`Kubernetes`のリリースワークフローを少し理解した後（その時、私は`docker`にさえあまり慣れていませんでした）、その日すぐに、私一人でも会社内でこのシステムを推進すると決めました。

事実が証明したように、私は正しかったです。その後、完全な`DevOps`システムを構築し、`Kubernetes`はその最後で最も重要なリンクでした。私たちは「運用なしの時代」から直接「運用不要の時代」に移行しました（Alibaba Cloudのアフターサービスに責任を転嫁🤣🤣🤣）。

しかし、事実が証明したように、私も間違っていました。従来のアプリケーションが流動的な`pod`になった後、解決する必要があるのは：

1. volume
1. ネットワーク診断
1. リソース監視とクォータ
1. クラウドベンダーコンポーネントのバグ
1. docker自体のバグ
1. システムカーネル（IPtable、cgroup、namespaceなど）自体のバグ

など、一連の問題です。どれを選んでも大きな問題です...

### 結論

**銀の弾丸はありません**。しかし、`Kubernetes`が今後10年間のアプリケーションデプロイメントの優先モデルになると信じています。

### 関連作業のレビュー
1. [Kubernetesシリーズ記事](http://www.zeusro.com/archive/?tag=Kubernetes)
2. [Kubernetes中国語本](https://github.com/zeusro/awesome-kubernetes-notes)

### 参考リンク
1. [孫健波：KubernetesはDevOpsを「殺す」か？](yq.aliyun.com/articles/742165)

## 2020：Alibaba（広告スペース募集中〜）

この側面については、私はあまり注意を払っていません（PR記事と技術共有を区別するのは時間の無駄なので、見ないことにしました）。

Alibabaの会社規模は比較的大きく、彼らが遭遇する問題と提案する解決策（中台、JVMの変更など）の多くは、小型企業には実際にはあまり役に立たない屠龍技に似ています。

しかし、参考になる点も多くあります。

たとえば、この`golang`の`Dockerfile`、そしてCloud Efficiencyの`DevOps`文化です。

### golang Dockerfile

```Dockerfile
FROM golang:1.14 AS build-env
ADD . /src/github.com/AliyunContainerService/kube-eventer
ENV GOPATH /:/src/github.com/AliyunContainerService/kube-eventer/vendor
ENV GO111MODULE on
WORKDIR /src/github.com/AliyunContainerService/kube-eventer
RUN apt-get update -y && apt-get install gcc ca-certificates
RUN make


FROM alpine:3.10

COPY --from=build-env /src/github.com/AliyunContainerService/kube-eventer/kube-eventer /
COPY --from=build-env /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

ENV TZ "Asia/Shanghai"
RUN apk add --no-cache tzdata
COPY deploy/entrypoint.sh /

ENTRYPOINT ["/kube-eventer"]
```

### Cloud Efficiency `DevOps`文化

![image](/img/road-of-devops/yunxiao1.png)

#### 研究開発モードの完全自動化

> 「コンテナ化」の波が到来するにつれて、私たちの研究開発プラットフォームは再びアップグレードされ、オンラインコンテナ定義、運用監視の責任をすべて開発者に委ね、アプリケーション運用ポジションは存在しなくなりました。

#### トラフィックリプレイテスト

> 2つ目はトラフィックリプレイテスト技術です。この技術革新はテストチームに大きな影響を与えました。オンライントラフィックをオフラインにコピーすることで、テスト回帰の問題を低コストで解決し、従来のテストケース作成によるテストを、データを編成してテストすることに簡素化しました。第2層はMock技術の応用で、分散システムの問題を単一マシンの問題に変換し、数秒で数千のテストケースを実行できます。これら2つの基礎技術を取得した後、上層でテストプラットフォームを開発でき、アルゴリズムの手段を通じて有効なトラフィックを識別し、データを自動処理し、異常なトラフィックの背後にある欠陥を識別できます。これら3つのレベルの変革を通じて、Alibabaのテスト効率に質的な変化をもたらしたと言えます。

#### フルリンク圧力テスト

> 3つ目はフルリンク圧力テスト技術です（Alibaba Cloud上の製品はPTSと呼ばれます）。Double 11で皆が安心して買い物できる理由、年々スムーズになる理由は、この技術が各大型プロモーション前に開発者がリスクを発見するのを助けることです。発見後は迅速な対応が必要で、DevOpsツールを通じてオンライン問題を解決します。各圧力テストは訓練であり、軍事演習に少し似ています—迅速に問題を発見し、迅速に解決し、チームのDevOps能力を継続的に鍛錬します。AlibabaのDevOps能力は、1回1回の「Double 11」によって鍛えられたと言えます。

#### 大胆に試し、底線を把握する

![image](/img/road-of-devops/yunxiao2.png)

### 結論

自分に合ったものが最善です。

### 参考リンク

1. [Alibaba DevOps文化の簡単な議論](https://yq.aliyun.com/articles/752195)
2. [DevOps研究開発モードでのCI/CD実践の詳細ガイド](https://yq.aliyun.com/articles/738405)

## その他のオプション

[gocd](https://github.com/gocd/gocd)

[理想的なDevOpプロセスはどうすればよいか？Slackのコードデプロイメント実践を見る](https://mp.weixin.qq.com/s?__biz=MzAwMDU1MTE1OQ==&mid=2653552052&idx=1&sn=bbc6dd52c9451dc807530ff5af2f50fd&chksm=813a6c2cb64de53a1d6818d72974150805dffcfda32f896c67e158a047b706036ab433b11e1d&mpshare=1&scene=23&srcid=&sharer_sharetime=1586425526712&sharer_shareid=75da3ea8231bb63b18e055a6e877643e#rd)

## まとめ

`DevOps`の核心的な考え方は1つだけです：**アプリケーション開発、デプロイ、監視、アップグレード/反復の効率を継続的に向上させる**。
