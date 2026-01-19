## Reason

Alibaba Cloud launched a [Cloud Native Application Competition](https://developer.aliyun.com/special/apphubchallenge), requiring submission of code using Helm v3. I took the opportunity to submit several Helm charts and learn Helm syntax at the same time.

## Syntax

Currently (2019-07-26) v3 hasn't been officially released yet, and documentation is scarce. When learning, you can only compare with old documentation and step on pitfalls.

The differences between v2 and v3 are significant:

1. Server-side component removed;
2. helm list now uses secrets;
3. Many commands are no longer compatible and have changed.

The pain point of learning Helm is understanding their template syntax. Template syntax includes some built-in functions and things related to `go template`.

[Variables](https://v3.helm.sh/docs/topics/chart_template_guide/variables/)
[Chart Development Tips and Tricks](https://helm.sh/docs/charts_tips_and_tricks/#using-the-include-function)

## Submitted Charts

[jekyll](https://github.com/cloudnativeapp/charts/pull/34)

[hexo](https://github.com/cloudnativeapp/charts/pull/33)

[codis](https://github.com/cloudnativeapp/charts/pull/39)

I put a lot of effort into codis. Please give me a tip and help me like it on the PR page~

## Differences from [kustomize](https://kustomize.io/)

kustomize was designed from the start as a lightweight YAML generator, so there's no server-side component;

kustomize's variable substitution is more troublesome and requires using JSON patch.

kustomize has no control flow, making high customization more difficult.

`Helm 3` stores installed chart information as secrets of type `type:helm.sh/release`, so `Helm 3` supports installing releases with the same name in multiple namespaces.
