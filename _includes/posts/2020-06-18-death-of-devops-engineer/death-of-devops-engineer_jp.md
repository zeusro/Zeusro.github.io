## 始まり

![image](/img/in-post/death-of-devops-engineer/devops.jpg)

2018年3月、私は正式に運用責任者となり、グループ内部のクラウドプラットフォームアカウントを引き継ぎました。

前任の運用責任者は天才でした。彼は私に、パスワードがまったくないサーバーの束を残しました。Tencent CloudとAlibaba Cloudの両方をカバーしています。さらに、無効なDNSレコードとCDNドメインが大量にありました。この混乱を片付けるのに1年以上かかりました。

2018年6月、偶然にも、Alibaba Cloud P8がKubernetesについて口頭で説明してくれました。その日の午後、私はすぐに、どんなに困難であっても、必ず実装すると決めました。

当時、私たちのシステムの一部はすでにAlibaba CloudのDocker Swarm上で実行されていましたが、リリースノートを見た後、そのものは間違いなく放棄されていると感じました。そこで、約3か月で、英語版の「Kubernetes in Action」を読んでコミュニティに参加することで、Dockerの知識ゼロの初心者からグループの**首席クラウドネイティブエバンジェリスト**にアップグレードしました。また、コミュニティの管理者にもなりました。

## Alibaba Cloud Kubernetes初期プロダクトマネージャー

さらに、私はAlibaba Cloud Kubernetesの初期プロダクトマネージャーにもなりました。多くの製品提案は私が提案し、その後、内部で評価・改善されました。

1. [コンテナイメージサービス：プライベートリポジトリ海外マシンビルドのサポート](https://connect.console.aliyun.com/connect/detail/84361)
1. [Kubernetes Webコンソール：ephemeral-storage設定のサポート](https://connect.console.aliyun.com/connect/detail/97716)
1. [コンテナイメージサービス：gcr.ioなどのイメージのプロキシサポート](https://connect.console.aliyun.com/connect/detail/78278)
1. [Kubernetes：ダッシュボードをできるだけ早く非推奨にし、その機能をAlibaba Cloudコンソールに統合](https://connect.console.aliyun.com/connect/detail/77011)
1. [Kubernetes：サービス作成の改善](https://connect.console.aliyun.com/connect/detail/75930)
1. [Kubernetes：RBACの改善](https://connect.console.aliyun.com/connect/detail/75929)
1. [Alibaba Cloud Kubernetes：SchedulingDisabledノードは仮想サーバーグループから自動的に削除される](https://connect.console.aliyun.com/connect/detail/73467)
1. [Kubernetes：「ノードスケジュール不可」機能の拡張、「メンテナンスノード」に変更](https://connect.console.aliyun.com/connect/detail/70803)
1. [Kubernetes：クラスター作成オプションの改善](https://connect.console.aliyun.com/connect/detail/70665)
1. [k8s：クラウドディスクデータボリュームの強化](https://connect.console.aliyun.com/connect/detail/61986)
1. [k8s：サービスの証明書ラベルの変更が有効にならない](https://connect.console.aliyun.com/connect/detail/57727)
1. [k8s：クラスターノード管理に関するドキュメントの追加](https://connect.console.aliyun.com/connect/detail/56229)
1. [クラウドモニター：K8Sクラウドモニタリングの改善](https://connect.console.aliyun.com/connect/detail/52189)
1. [コンテナサービス：PV表示がユーザーフレンドリーでない](https://connect.console.aliyun.com/connect/detail/51523)
1. [K8S：PODターミナルに入った後の操作時間が短すぎる](https://connect.console.aliyun.com/connect/detail/50469)
1. [k8s：デプロイメント設定ページに問題がある](https://connect.console.aliyun.com/connect/detail/49659)
1. [k8s：ボリュームの制限と改善](https://connect.console.aliyun.com/connect/detail/49640)
1. [k8s：名前空間情報の同期に問題がある](https://connect.console.aliyun.com/connect/detail/49361)
1. [k8s：Ingress TLSのキャンセルが有効にならない](https://connect.console.aliyun.com/connect/detail/48979)
1. [Alibaba Cloudイメージリポジトリ：ユーザーエクスペリエンスの最適化](https://connect.console.aliyun.com/connect/detail/48110)
1. [k8s：マスターをメンテナンスするときに奇妙なロードバランサーが表示される](https://connect.console.aliyun.com/connect/detail/48072)
1. [k8s：HPAの改善](https://connect.console.aliyun.com/connect/detail/48041)
1. [Alibaba CloudコンテナサービスK8Sが独立したSLBバインディングをサポートできることを希望](https://connect.console.aliyun.com/connect/detail/47469)
1. [k8s：IngressルートにTLSを追加するときに問題がある](https://connect.console.aliyun.com/connect/detail/47443)
1. [k8s：LoadBalancerサービスとロードバランサーのバインディングの改善](https://connect.console.aliyun.com/connect/detail/52594)
1. [k8s：プライベートイメージでデプロイメントを作成するときに問題がある](https://connect.console.aliyun.com/connect/detail/47147)
1. [K8Sデプロイメント詳細ページにバグがあることを偶然発見](https://connect.console.aliyun.com/connect/detail/47034)
1. [Alibaba CloudコンテナKubernetesインターフェースが固有名詞を強制的に翻訳しないことを希望!!!](https://connect.console.aliyun.com/connect/detail/46590)
1. [K8S：アプリケーション作成ページの関連チュートリアルの改善](https://connect.console.aliyun.com/connect/detail/43756)
1. [K8Sアプリケーションデプロイメントのユーザーエクスペリエンスの最適化](https://connect.console.aliyun.com/connect/detail/43736)
1. [ユーザーがK8Sマスターの支払い方法を柔軟に選択できるようにする](https://connect.console.aliyun.com/connect/detail/43655)
1. [コンテナサービス：ヘルスチェックが役に立たない](https://connect.console.aliyun.com/connect/detail/40484)
1. [コンテナサービス：ログサービスの改善](https://connect.console.aliyun.com/connect/detail/40792)

2018-05-13から現在まで、コンテナ分野に関して数十の提案を提出しました。一部は採用されませんでしたが、私は「**Alibaba Cloud Kubernetes初期プロダクトマネージャー**」という称号に値すると思います。

最も印象的なバグはこれでした：
[k8s：Ingress TLSのキャンセルが有効にならない](https://connect.console.aliyun.com/connect/detail/48979)

私は約3か月間フォローアップし、当時のAlibaba Cloudプロダクトマネージャーにビデオも送りました。

## NoOps

![image](/img/in-post/death-of-devops-engineer/waterfall.jpg)

従来のアプリケーションのウォーターフォールモデルがどれほどひどいかは文句を言いません—理解する人は理解します。その運用責任者が私を困らせた後、Kubernetesを見ることは救世主を見るようなものでした。その後、Kubernetesを使用してサーバーの大部分を回収しました。パスワードのないサーバーについては、真夜中にパスワードをリセットして再起動するショック療法を使用するか、1〜2年待って、クラウドディスクをバックアップしてから直接返金しました。

## Kubernetes時代のサーバーパスワードの忘れ

私が書いたものを参照できます：
[Alibaba Cloud Kubernetesクラスターのスケーリングとノードカーネルのアップグレード](https://developer.aliyun.com/article/756235)

わずかな違いは：

![image](/img/in-post/death-of-devops-engineer/QQ20200618-163420.png)

[ノードメンテナンス](https://cs.console.aliyun.com/#/k8s/node/list)ここでは「**スケジュール不可**」に設定する必要があります。その後、ノード内のポッドをゆっくりと排出します。

ノード内の残りのポッドが重要でなくなったら、ノードを直接削除して、対応するECSを返金できます。

## 不満

![image](/img/in-post/death-of-devops-engineer/no-silver.jpg)

Alibaba Cloudは常に私にバウチャーを送るのをやめてもらえませんか？これが続くと、私のドメイン名は100年間更新されることになります。

## 参考リンク

[1]
2017年のクラウドトレンド—DevOpsからNoOpsへ
http://dockone.io/article/2126
