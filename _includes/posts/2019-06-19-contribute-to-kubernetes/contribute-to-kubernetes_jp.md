<!-- TODO: Translate to jp -->

fork+pull request 这种基础操作就不用提了吧。


## 节操

但一般大型项目都会引入一个节操的机制，就Kubernetes类项目来说，在遵守代码提交规范的基础上，需要先同意CLA之后，pr才有被合并的机会。

如果贸贸然直接pr，就会被`k8s-ci-robot`这个机器人账户直接打上`cncf-cla: no`.

那么要怎么同意CLA呢？

## 注册

根据这个指示，按个人或者组织申请账户，关联起来就行。我当时直接选择用GitHub账户关联 Linux 基金会。

https://github.com/kubernetes/community/blob/master/CLA.md#the-contributor-license-agreement

1. 验证邮箱（该邮箱要跟GitHub账户邮箱一致）
1. 重设密码
1. 电子签署SLA文件

## 修正提交信息

之前用电脑提交代码的时候，都是不填email的，结果导致提交上去的个人信息是一个空的头像，于是我只得设置一下email，跟GitHub账户保持一致。

```bash
git config --global user.email "email@example.com"
git commit --amend --reset-author
git push --force
```

这通操作之后，提交信息跟 GitHub/Linux 基金会注册信息保持一致啦。但是`cncf-cla: no`这个标签还在。

于是我向天空大喊一声“I signed it”

`k8s-ci-robot`出来给我重新验证了cla，并打上`cncf-cla: yes`标签，合并的流程进入到review阶段

## 友好交流（撕逼）

https://github.com/kubernetes-sigs/kustomize/pull/1204