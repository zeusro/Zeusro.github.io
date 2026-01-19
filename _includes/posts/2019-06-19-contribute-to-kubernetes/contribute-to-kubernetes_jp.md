fork+pull requestのような基本的な操作は言うまでもありません。

## 節操

しかし、一般的に大型プロジェクトは節操のメカニズムを導入します。Kubernetesのようなプロジェクトの場合、コード提出規約を遵守することを基礎として、CLAに同意した後、PRがマージされる機会があります。

これをせずに直接PRを提出すると、`k8s-ci-robot`というボットアカウントが直接`cncf-cla: no`のタグを付けます。

では、CLAに同意するにはどうすればよいでしょうか？

## 登録

この指示に従って、個人または組織としてアカウントを申請し、リンクします。私は直接GitHubアカウントをLinux Foundationとリンクすることを選択しました。

https://github.com/kubernetes/community/blob/master/CLA.md#the-contributor-license-agreement

1. メールを確認（このメールはGitHubアカウントのメールと一致する必要があります）
1. パスワードをリセット
1. SLA文書に電子署名

## コミット情報の修正

以前コンピューターでコードを提出したとき、メールを入力しなかったため、提出された個人情報が空のアバターになりました。そのため、GitHubアカウントと一致するようにメールを設定する必要がありました。

```bash
git config --global user.email "email@example.com"
git commit --amend --reset-author
git push --force
```

これらの操作の後、コミット情報はGitHub/Linux Foundationの登録情報と一致します。しかし、`cncf-cla: no`タグはまだ残っています。

そこで、空に向かって「I signed it」と叫びました。

`k8s-ci-robot`がCLAを再確認し、`cncf-cla: yes`タグを付け、マージプロセスがレビューステージに入りました。

## 友好的な交流（議論）

https://github.com/kubernetes-sigs/kustomize/pull/1204
