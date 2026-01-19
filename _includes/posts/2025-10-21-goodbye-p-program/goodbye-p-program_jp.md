今年の生成AI大爆発の後、技術を共有するモチベーションが大きく失われた。
例えば、このGithub actionの設定は、以前なら2〜3日かかっていただろう。今回はOpenAIの助けを借りて3時間以内に完了した。

## Hello,Github action

調整プロセスは非常に簡単：
1. [p-program.github.io](https://github.com/p-program/p-program.github.io) pages-GitHub Pagesの設定をデフォルト値に変更し、Custom domainを空にする
1. ソースコードプロジェクトの**Dependabot alerts**を解決する
1. ソースコードプロジェクトにプロンプトに従って`.github/workflows/deploy.yml`を追加する

調整後は、静的HTML成果物をエクスポートする必要がなくなり、DNSも変更する必要がなく（無料利用を防止）、pushイベントごとに自動更新される。完璧で、試す価値がある。

```yml
on:
  push:
    branches:
      - mster      # メインブランチがmaster / main / msterの場合、正しいブランチ名に調整
  # 手動トリガーを保持
  workflow_dispatch:
```

[https://www.bullshitprogram.com/](https://github.com/p-program/p-program.github.io)は、当時代金券が多すぎて使い道がなくて買ったドメインである。

初期の記事は王垠の個人的な経験からインスピレーションを得た。

王垠の初期の記事（中国に戻って教育を行う前）を読むと、常に新鮮な感覚があり、伝統的なプログラミング概念に対する私の偏見を打ち破ってくれた。

「プログラミング概念はこんな風にできるのか？！いわゆるOOPはこれだけなのか！」

その後、このウェブサイトは主に最先端の技術的洞察、または「皮学」を発表していた。

## いくつかの歴史的遺留問題の解決

```
Dependabot encountered an error performing the update

Error: The updater encountered one or more errors.

For more information see: https://github.com/p-program/readme/network/updates/1130827200 (write access to the repository is required to view the log)
```

Dependabotのセキュリティチェックは主にプロジェクトのサプライチェーンシステムを対象としている——一部の依存関係が安全なバージョンにアップグレードされていない。プロンプトに従って修正するか、手動でアップグレードする。

情報技術に長年従事してきたが、私は常にこの業界に対して矛盾した意見を持っている。しかし、全体的には反対の態度が主である。
技術の発展は生産力を真に解放したわけではなく、人を定量化計算のツールにした。

2020年に私が[OOOS](https://www.bullshitprogram.com/one-open-operating-system/)を提案し、[AIをインテリジェントAPIエントリとして](https://www.bullshitprogram.com/the-seed-of-robot/)使用した時、本来の意図はAIを使って人の創造性を迅速に実現することだった。

しかし、今日見る限り、ほとんどの企業はそれをレイオフツールとして使用しており、本当に腹立たしい。
