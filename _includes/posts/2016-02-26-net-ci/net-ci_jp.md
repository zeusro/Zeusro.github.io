* [準備作業](#準備作業)
* [グローバル設定](#グローバル設定)
  * [Gitプラグインの設定](#gitプラグインの設定)
  * [MSBuildプラグインの設定](#msbuildプラグインの設定)
  * [GitLabプラグインの設定](#gitlabプラグインの設定)
* [Jobの設定](#jobの設定)
  * [SSHの問題](#sshの問題)
  * [ソースコード管理](#ソースコード管理)
  * [トリガー](#トリガー)
  * [ビルド](#ビルド)   
* [血と涙の教訓](#血と涙の教訓)
* [Jenkinsディレクトリの変更](#jenkinsディレクトリの変更)
* [いくつかの設定](#いくつかの設定)
* [プラグインの選択](#プラグインの選択)
* [例外処理](#例外処理)
  * [セキュリティオプションの誤設定によりログインできない](#セキュリティオプションの誤設定によりログインできない)
* [参考リンク](#参考リンク)

![Image](/img/in-post/net-ci/ci_1.png)

## 準備作業

インストール後、MSBuild、GitLab、GitLab-hookプラグインをインストールすることを忘れないでください。

サーバー上では、.NET環境とGitをインストールする必要があります。

## グローバル設定

- Git plugin

任意のユーザー名とメールアドレスを入力するだけでOKです。

## Global Tool Configuration

いつからか、プラグインの設定がこの場所に移動しました。ここでいくつかの設定を行う必要があります：

- MSBuild

![Image](/img/in-post/net-ci/msbuild设置.png)

- Git

主にGitの実行ファイルを設定します。PATHに追加したので、これはスキップします。

## Credentials

認証情報の設定は少し変わっています。

(global)をクリックし、ポップアップで「Add Credentials」をクリックします。

## Jobの設定

- SSHの問題

すべてのWindowsコマンドには実際にロールが付属していることを私たちは知っています。以前Gitを使用していたとき、SSH秘密鍵をサーバーに追加していたのに、git pushが失敗しました。これは、使用していたロールに問題があったためです。

Jenkinsは**Local System account**を使用します。SSHキーでGitLab上のプロジェクトに接続する際は、システムユーザーの.sshフォルダをJenkinsが使用するユーザーのフォルダにコピーする必要があります。

しかし、その前に、GitLabホストにSSH（Gitのインストールディレクトリにこのexeがあります）する必要があります：

```bash
ssh.exe -T git@192.1.1.123
```

known_hostsにこのホストが含まれていることを確認したら、.sshフォルダ全体を**C:\Windows\SysWOW64\config\systemprofile**と**C:\Windows\System32\config\systemprofile**にコピーします。

**ヒント**

「permission denied」が表示された場合は、このコマンドを追加してください：

```bash
ssh-keygen -t rsa -C "robot233@robot.com"
```

known hostがどのディレクトリに追加されたかを確認し、生成したキーを失敗の原因となったディレクトリにコピーします。

- ソースコード管理

上記の必須プラグインをインストールした後、ソースコードセクションでGitを選択できます。ここではSSHを使用したので、以下の画像のような形式になります：

![Image](/img/in-post/net-ci/job里面的git设置1.png)

**重要：**

この認証情報にはコンピューターユーザーのSSHを使用しないでください。GitLabは1台のマシンに1つのSSHのみを許可し、同じSSHを複数のアカウントに追加することはできません。これにより問題が発生します：このビルドマシンはソースコードプロジェクトに接続する必要があるため、SSHキーが必要です。しかし、コンパイル後の結果については、WindowsでGitを使用してディレクトリ同期を行うため、ロボットアカウントに接続する別のSSHが必要です。これら2つのSSHキーが同じ場合、1つのステップが失敗します。

ソースブラウザーは実際には対応するGitLabプロジェクトにジャンプするため、HTTPを使用します：

![Image](/img/in-post/net-ci/job里面的git设置2.png)

- トリガー

これは非常に重要です。必要に応じてチェックして選択した後：

![Image](/img/in-post/net-ci/job里面的git设置3.png)

「Build when a change is pushed to GitLab. GitLab CI Service URL」の後のURLをコピーします。

対応するGitLabプロジェクト設定に戻り、Settings → Web HooksでこのURLを入力し、必要に応じてチェックして、確認後に追加します。

これにより、GitLab上のソースコードに変更があると、web hookがトリガーされ、CIに作業を開始するよう通知されます。

![Image](/img/in-post/net-ci/添加WebHook.png)

- MSBuild

ここでは主にMSBuildの構文を学習する必要があります。このCIを構築した当初の目的は、純粋にWebサイトをコンパイルすることでした。以下はよく使用され、非常に理解しやすいものです：

```text
/p:PublishProfile="F:xxxxx.pubxml"
/p:DeployOnBuild=true
/p:Configuration=Release
/p:VisualStudioVersion=12.0  
/property:TargetFrameworkVersion=v4.5
```

pubxmlファイルは、公開を選択すると生成されます。自分で確認でき、非常に理解しやすいです。

開発マシンでMSBuildを一度実行することをお勧めします。

一般的に、MSBuildは**cd C:\Windows\Microsoft.NET\Framework64\v4.0.30319\**にあります。

次に：

```bash
cd C:\Windows\Microsoft.NET\Framework64\v4.0.30319\
MSBuild.exe "C:\xxxxx.sln" \
/p:PublishProfile="C:\xxxxx.pubxml" \
/p:DeployOnBuild=true \
/p:Configuration=Release \
/p:VisualStudioVersion=12.0 \
/property:TargetFrameworkVersion=v4.5 \
/verbosity:n \
/t:Rebuild \
/maxcpucount:16
```

私が推奨する設定は：

```bash
/p:PublishProfile="C:\xxxxx.pubxml" \
/p:DeployOnBuild=true \
/p:Configuration=Release \
/p:VisualStudioVersion=12.0 \
/property:TargetFrameworkVersion=v4.5 \
/verbosity:n \
/maxcpucount:16
```

コンパイルしてサーバーにデプロイした後、通常は問題ありません。

しかし、私は**問題がありました!!!!**

- NuGetフィードの問題

プロジェクトでプライベートNuGetパッケージを使用しているため、これらは公式のNuGetソースでは見つかりません。そのため、VSと同様に、CIサーバー上で独自のフィードを設定する必要があります。

**C:\Windows\SysWOW64\config\systemprofile\AppData\Roaming\NuGet**でNuGet.Configを見つけ、以下に変更します：

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageRestore>
    <add key="enabled" value="True" />
    <add key="automatic" value="True" />
  </packageRestore>
  <bindingRedirects>
    <add key="skip" value="False" />
  </bindingRedirects>
  <packageSources>
    <add key="nuget.org" value="https://www.nuget.org/api/v2/" />
    <add key="プライベートフィード" value="D:\nuget" />     
  </packageSources>
  <activePackageSource>
    <add key="All" value="(Aggregate source)" />
  </activePackageSource>
</configuration>
```

- コンパイル失敗の問題

これは我慢できません。私のコンピューターでは全く問題がなかったのに、サーバーでは絶対にコンパイルできませんでした。後で、プログラム内のサードパーティDLLとプライベートNuGetパッケージを重点的にチェックし、すべてのエラーがそこにあることを発見しました。開発マシンで気づかなかった理由は、開発マシンのNuGet依存関係にローカルキャッシュがあったためです。コンパイル時に直接スキップされました。35回の試行後、ついに私のプログラムがCI上で正常にコンパイルされました。

- Git権限の問題 - プロジェクトをクローンできない

これはジョブ設定エラーです。ジョブのGit設定で、「SSH Username with private key」を選択し、秘密鍵を直接入力し、~/.ssh/id_rsaの内容を完全にコピーします。これには、最初と最後の意味のない区切り文字も含まれます！

## 血と涙の教訓

- GitLabの**test hook**を使用しないでください

当時、プロジェクトには2つのブランチがありました。特定のブランチから生成したかったのですが、test hookをクリックしてしまいました。しまった、メインブランチのコンテンツがすべて引き込まれてしまいました。

## 例外処理

### AnonymousにOverall/Administer権限がない

http://stackoverflow.com/questions/22833665/hudson-security-accessdeniedexception2-anonymous-is-missing-the-overall-admini

### セキュリティオプションの誤設定によりログインできない

変更：

```xml
<authorizationStrategy class="hudson.security.AuthorizationStrategy$Unsecured"/>
```

```bash
cd jenkinsディレクトリ
# 再起動
jenkins restart   # Forces
```

## Jenkinsディレクトリの変更

> Jenkinsサービスを停止

> C:\Users\Coola\.jenkinsフォルダをd:\Jenkinsに移動

> regeditを使用して、HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Jenkins\ImagePathを"d:\Jenkins\jenkins.exe"に変更

> サービスを開始

## いくつかの設定

- この権限は「任意のユーザーが何でもできる（制限なし）」に対応します

```xml
<authorizationStrategy class="hudson.security.AuthorizationStrategy$Unsecured"/>
```

- この権限は「ログインしたユーザーが何でもできる」に対応します

```xml
<authorizationStrategy class="hudson.security.FullControlOnceLoggedInAuthorizationStrategy"/>
```

## プラグインの選択

| プラグイン名      | 用途                          | 紹介URL                                                      |
| ---------------- | ----------------------------- | ------------------------------------------------------------ |
| proxy            | プロキシ                      |                                                              |
| gitlab           | GitLab統合用                  | https://wiki.jenkins-ci.org/display/JENKINS/GitLab+Plugin   |
| publish-over-ssh | SSH経由で他のLinuxマシンに接続 |                                                              |
| Mercurial       | ビルドツール                  | https://wiki.jenkins-ci.org/display/JENKINS/Mercurial+Plugin |
| gitlab-hook     | Gitlab web hooksを使用してGitlabプロジェクトでSMCポーリングをトリガーできるようにする | https://wiki.jenkins-ci.org/display/JENKINS/GitLab+Hook+Plugin |

## 参考リンク

1. [セキュリティの無効化](https://wiki.jenkins-ci.org/display/JENKINS/Disable+security)
2. [権限の設定](http://www.cnblogs.com/zz0412/p/jenkins_jj_14.html)
3. [GitLab + JenkinsでCIを構築](http://zipperary.com/2015/07/10/%E7%94%A8-gitlab-+-jenkins-%E6%90%AD%E5%BB%BA-ci/?utm_source=tuicool&utm_medium=referral)
4. [Jenkins .NET自動ビルドテストとリリース環境](http://blog.csdn.net/wangjia184/article/details/18365553)
5. [Jenkins+Gitlabで継続的統合（CI）環境を構築](http://hyhx2008.github.io/li-yong-jenkinsgitlabda-jian-chi-xu-ji-cheng-cihuan-jing.html)
6. [MSBuildとJenkinsで継続的統合環境を構築（1）](http://www.infoq.com/cn/articles/MSBuild-1)
7. [MSBuildとJenkinsで継続的統合環境を構築（2）](http://www.infoq.com/cn/articles/MSBuild-2)
8. [Jenkins上級シリーズ](http://www.cnblogs.com/zz0412/tag/jenkins/)
9. [Jenkins CI統合](http://doc.gitlab.com/ee/integration/jenkins.html)
10. [GitLabドキュメント](http://doc.gitlab.com/ce/ci/quick_start/README.html)
11. [Jenkins CI用にリポジトリを設定](https://github.com/dotnet/dotnet-ci/blob/master/docs/CI-SETUP.md)
12. [Windows 7 x64でJenkins git clone via SSH](http://computercamp-cdwilson-us.tumblr.com/post/48589650930/jenkins-git-clone-via-ssh-on-windows-7-x64)
13. [Jenkinsで継続的統合サービスを構築](http://chenpeng.info/html/3081?utm_source=tuicool)
14. [独自のNuGetフィードをホスト](https://docs.nuget.org/create/hosting-your-own-nuget-feeds)
15. [コマンドラインでMSBuild.exeを使用してASP.NET MVC 4プロジェクトを「公開」](http://stackoverflow.com/questions/13920146/using-msbuild-exe-to-publish-a-asp-net-mvc-4-project-with-the-cmd-line)
16. [プロジェクト開発環境構築メモ（5. Jenkins構築）](http://blog.csdn.net/fbysss/article/details/44087185)
17. [MSBuild DeployOnBuild=trueが公開しない](http://stackoverflow.com/questions/4962705/msbuild-deployonbuild-true-not-publishing)
18. [WindowsでJenkinsのデフォルトフォルダを変更する方法](http://stackoverflow.com/questions/12689139/how-to-change-jenkins-default-folder-on-windows)
19. [Jenkins環境変数](https://wiki.jenkins-ci.org/display/JENKINS/Building+a+software+project#Buildingasoftwareproject-JenkinsSetEnvironmentVariables)
