## 理由

阿里雲が[クラウドネイティブアプリケーションコンテスト](https://developer.aliyun.com/special/apphubchallenge)を開催し、Helm v3を使用してコードを提出する必要がありました。機会を利用して、いくつかのHelmチャートを提出し、同時にHelmの構文を学びました。

## 構文

現在（2019-07-26）v3はまだ正式にリリースされておらず、ドキュメントは少ないです。学習する際は、古いドキュメントと比較して、落とし穴を踏むしかありません。

v2とv3の違いは大きいです：

1. サーバー側コンポーネントが削除されました；
2. helm listはシークレットを使用するようになりました；
3. 多くのコマンドが互換性がなくなり、変更されました。

Helmを学習する際の痛みは、テンプレート構文を理解することです。テンプレート構文には、いくつかの組み込み関数と`go template`に関連するものが含まれます。

[Variables](https://v3.helm.sh/docs/topics/chart_template_guide/variables/)
[Chart Development Tips and Tricks](https://helm.sh/docs/charts_tips_and_tricks/#using-the-include-function)

## 提出したチャート

[jekyll](https://github.com/cloudnativeapp/charts/pull/34)

[hexo](https://github.com/cloudnativeapp/charts/pull/33)

[codis](https://github.com/cloudnativeapp/charts/pull/39)

codisには多くの努力を費やしました。PRページでいいねを押して、チップをください〜

## [kustomize](https://kustomize.io/)との違い

kustomizeは最初から軽量のYAMLジェネレーターとして設計されているため、サーバー側コンポーネントはありません；

kustomizeの変数置換はより面倒で、JSONパッチを使用する必要があります。

kustomizeには制御フローがないため、高度なカスタマイズがより困難です。

`Helm 3`は、インストールされたチャート情報を`type:helm.sh/release`タイプのシークレットとして保存するため、`Helm 3`は複数のネームスペースで同じ名前のリリースをインストールすることをサポートします。
