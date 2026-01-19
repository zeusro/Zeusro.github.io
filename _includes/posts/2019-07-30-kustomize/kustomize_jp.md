## helmを使用しない理由

[この記事](https://medium.com/virtuslab/think-twice-before-using-helm-25fbb18bc822)で詳しく説明されています。

helm2は巨大な赤ちゃんのようです。個人的には好きになれません。

kustomizeの非侵入的で軽量な生成モードを好みます。

（後記：Helm3をしばらく使用した後、helm3が基本的に要件を満たしていることがわかり、helm 3はサーバー側を削除しました）

## 基本概念

base：他のkustomization.yamlファイルによって参照できるkustomization.yamlファイルを含むディレクトリ。
resource：kubernetes APIオブジェクトを宣言するYAMLファイルを指すファイルパス。

patch：kubernetes APIパッチを宣言するYAMLファイルを指すファイルパス。

variant：同じベースのセットを含む異なるkustomization。


[用語](https://github.com/kubernetes-sigs/kustomize/blob/master/docs/glossary.md)

## 準備

1. kubectlをバージョン1.14にアップグレード
1. [ダウンロード](https://github.com/kubernetes-sigs/kustomize/releases)してkustomizeをインストールし、$pathに追加

## 基本ディレクトリ構造

```
├── base
│   ├── deployment.yaml
│   ├── kustomization.yaml
│   └── service.yaml
└── overlays
    ├── dev
    │   ├── kustomization.yaml
    │   └── patch.yaml
    ├── prod
    │   ├── kustomization.yaml
    │   └── patch.yaml
    └── staging
        ├── kustomization.yaml
        └── patch.yaml
```

## 実際の運用

[私が書いた例](https://github.com/zeusro/kustomize-example)


## 参考リンク：

1. https://zhuanlan.zhihu.com/p/38424955
1. https://aisensiy.github.io/2018/11/27/helm-and-kustomize/
2. https://yq.aliyun.com/articles/699126?spm=a2c4e.11163080.searchblog.38.273b2ec1q8XHEg
3. https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/
