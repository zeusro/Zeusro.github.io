最近、核弾の作り方を学んでいて、ちょうど[Dragonfly](https://github.com/dragonflyoss/Dragonfly)のグループで、アリペイのバデさんが別のサブプロジェクトNydusをライブストリームで共有しているのを見かけました。

私の理解では、Nydusは次世代コンテナフォーマットの実装です。その存在は主に古いコンテナフォーマット（container format）の問題を解決するためです。

では、Nydusとは何か？container formatとは何か？Nydusは具体的にどのような問題を解決するのか。まず用語の説明から始めます。

## 用語の説明

実際、コンテナ技術は1979年から現在まで[40年以上](https://www.infoq.cn/article/SS6SItkLGoLExQP4uMr5)発展しており、dockerはこれまでのところ、より有名で人気のある実装の一つに過ぎません。dockerはアプリケーション配布の難題を解決し、後のkubernetesの流行の基礎を築いたと言えます。

しかし、よく言われるように、**勇者が悪竜を倒す日、自身も悪竜となる**。Docker社の後の様々な操作（プロジェクトをMobyに改名、docker swarmの弱いオーケストレーション）であれ、CoreOSの台頭であれ、**オープンソース世界の戦争は、技術標準の世界的な発言権をめぐる争い**であり、この争いは想像以上に残酷です。

### OCI

OCIは[Open Container Initiative](https://opencontainers.org/)の略で、Linux Foundationに属し、Docker、CoreOSが他のコンテナベンダーと共同で2015-6-22に設立したオープンソース組織です。その目的は主にコンテナ技術の共通技術標準を制定することです。

OCIには主に2つのプロジェクトがあります：

1. [runtime-spec](https://github.com/opencontainers/runtime-spec)
2. [image-spec](https://github.com/opencontainers/image-spec)

### OCIv1

![image](/img/in-post/oci-v2/Container-Images.jpg)

[OCIv1](https://github.com/opencontainers/image-spec/milestone/4)が現在のコンテナフォーマットです。

### OCIv2

OCIv2はOCIv1の歴史的技術的負債を解決するために設計されました。

### Dragonfly Nydus

2020年4月10日、CNCF技術監督委員会の投票により、中国のオープンソースプロジェクトDragonflyが正式にCNCFインキュベーションレベルのホストプロジェクトに昇格し、Harbor、TiKVに続いて、CNCFインキュベーション段階に入った3番目の中国プロジェクトとなりました。

![image](/img/in-post/oci-v2/Dragonfly.jpg)

Dragonflyのアーキテクチャは主に大規模イメージダウンロード、長距離転送、帯域幅コスト制御、安全な転送という4つの主要な問題を解決するために設計されています。

![image](/img/in-post/oci-v2/Nydus-Architecture.jpg)

NydusはOCIv2の実装で、Dragonflyに寄贈され、そのサブプロジェクトとして運営される予定です。

## 現在のコンテナフォーマットの問題

![image](/img/in-post/oci-v2/Prior-Community-Work-Comparison.jpg)

ライブストリームで、バデさんはOCIv1のいくつかの問題に言及しました：

1. レイヤー効率が非常に低い
1. データ検証がない
1. 再構築可能性の問題

### レイヤー効率が非常に低い

![image](/img/in-post/oci-v2/h1.png)

レイヤー効率の低さは主に冗長性を指します。docker imageをハンバーガーに例えると、イメージAはチーズバーガーです。

```dockerfile
FROM centos
```

![image](/img/in-post/oci-v2/h2.png)

イメージBはダブルチーズバーガーです。

```dockerfile
FROM centos
RUN yum update -y
```

```bash
# チーズバーガーをプル
docker pull h1
# ダブルチーズバーガーをプル
docker pull h2
```

現在の設計では、イメージは互いに独立しています。つまり、h1をプルした後、ディスクにcentosのベースイメージがキャッシュされていても、h2をプルする際には、centosのベースイメージを再利用せず、イメージ全体を再プルします。これにより、ディスクの冗長性とネットワークトラフィックの浪費が最終的に発生します。

レイヤー効率の低さには別の現れ方もあります。

```dockerfile
FROM ubuntu:14.04
ADD compressed.tar /
# ここの削除は単なるマーカーで、実際のイメージサイズ = compressed.tar * 2 + ubuntu:14.04
RUN rm /compressed.tar
ADD compressed.tar /
```

このdocker imageの場合、実際に実行する際、container内のルートディレクトリサイズはイメージよりもはるかに小さくなります。

したがって、**イメージサイズとコンテナサイズには根本的な違いがあります**。

### データ検証がない（Verifiability）

バデさんの言葉を引用します：

> 読み取り専用レイヤーが変更されても、コンテナアプリケーションはそれを知りません。現在のOCIイメージフォーマットでは、このようなことが起こる可能性があります。イメージは構築と転送中は検証可能ですが、イメージがローカルにダウンロードされると解凍され、解凍されたファイルの変更は検出できません。
>
> イメージはダウンロードされ、ローカルファイルシステムに解凍され、その後コンテナに渡されて使用されます。このプロセスで、ローカルファイルシステムに解凍するステップが信頼を失う重要なポイントです。

### workspaceの再構築可能性の問題（repairability）

再構築可能性は、ある程度docker buildの遅さの問題を解決できます。

軽量級kubernetesイベントエクスポートコンポーネント[kube-eventer](https://github.com/AliyunContainerService/kube-eventer/blob/master/deploy/Dockerfile)を例にします：

```dockerfile
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

マシンAでdocker buildを繰り返し実行すると、各ビルドは原子的です。つまり、毎回上から下まで再実行されます。しかし、実際には多くの命令が繰り返されており、繰り返し実行する必要がないことがわかっています。

再構築可能性には別の意味もあります。マシンAからマシンBにコピーした後、docker imageの構築を続けることです。

## 私の考え

私の意見では、現在のOCIv1はgitの設計を参考にしていますが、本質的には食べにくいハンバーガーです。最上層だけが食べられます（読み書き）。

クラウドネイティブアプリケーションの配信サイクルは、一般的に：

> git Ops --> CI --> docker image --> waiting container/pod（docker pull、sandbox etc） --> running container/pod --> terminated container/pod

クラウドネイティブアプリケーションのセキュリティは、ランタイム環境とdocker containerで構成されます。安全なdocker containerは、各段階で機会を残さないようにする必要があります。

例えば、コードからCIへのプロセスでは、静的コード解析+手動code reviewのメカニズムがあり、コードにセキュリティ上の問題がないことを確認する必要があります。CIからdocker imageの構築プロセスでは、CIを信頼できる環境で実行する必要があります。この信頼できる環境には、信頼できる権威DNS、制御可能なセキュリティファイアウォール、制限されたネットワーク接続、セキュリティスキャンスイート（ウイルス対策ソフトウェア）が含まれます。

![image](/img/in-post/oci-v2/Image-Format.jpg)

この観点から、Nydusが各レイヤーのハッシュを計算することは、専門的ではないだけでなく、遅いです。この内容はより効率的なセキュリティエンジンに委ね、Nydusは非同期イベントコールバック/メッセージpub-subを行う方が良いかもしれません。

要約すると、短いバレル原理と組み合わせて、次の結論を導き出すことができます：**コンテナのセキュリティはすべての当事者の協調を必要とし、クラウドネイティブアプリケーションは絶対的な意味でのセキュリティは存在しません**。

最後に、[Dragonfly](https://github.com/dragonflyoss/Dragonfly)プロジェクトへの参加を歓迎します。プロジェクトのDingTalkグループオーナーは「Dockerソースコード分析」の著者[孫宏亮](https://github.com/allencloud)です。国内で「21日でXXを学ぶ」というゴミ技術書が流行している中、この本は清流です。

![image](/img/in-post/oci-v2/build.gif)

また、[OCIv2標準の共同構築](https://hackmd.io/@cyphar/ociv2-brainstorm)への参加も歓迎します。

## 結論

PPT first、bug secondly。

~~[孫宏亮](https://github.com/allencloud)さんが書いた第一版「Dockerソースコード分析」を密かに大量購入し、その後アリクラウドに潜入してサインをもらい、最後に転売したい🤣~~

![image](/img/in-post/oci-v2/jihuatong.png)

## 参考リンク

[1]
docker、oci、runcおよびkubernetesの整理
https://xuxinkun.github.io/2017/12/12/docker-oci-runc-and-kubernetes/

[2]
About the Open Container Initiative
https://opencontainers.org/about/overview/

[3]
The Road to OCIv2 Images: What's Wrong with Tar?
https://www.cyphar.com/blog/post/20190121-ociv2-images-i-tar

[4]
重要 | DragonflyがCNCFインキュベーションプロジェクトに昇格
https://developer.aliyun.com/article/754452

[5]
Dockerfile操作の推奨事項
https://jiajially.gitbooks.io/dockerguide/content/chapter_fastlearn/dockerfile_tips.html

[6]
露出したAPIを利用し、検出不可能なLinuxマルウェアがDockerサーバーを標的に
https://mp.weixin.qq.com/s?__biz=MzA5OTAyNzQ2OA==&mid=2649710368&idx=1&sn=afc957a5622a9bb658aa63574368400e&chksm=88936043bfe4e95563e6d8ca05c2bce662338072daa58f2ffd299ecbf26a7b57e33b5c871e4c&mpshare=1&scene=23&srcid=0803MLplml3bb8uyaXAyC2Rg&sharer_sharetime=1596696405119&sharer_shareid=9b8919de2238b20229856a42c8974cdc%23rd
