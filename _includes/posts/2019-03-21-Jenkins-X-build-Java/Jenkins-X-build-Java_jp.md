`Jenkins-X`はデフォルトで異なる言語の[さまざまな例](https://jenkins.io/doc/pipeline/tour/hello-world/#examples)を提供しています。まずデフォルトの例を学習し、その後、自身の状況に応じて適応させます。

まず、ビルドプロセスを理解しましょう：

gitサーバー（GitHub/gitea）からコードをプル -> dockerイメージをビルド -> イメージレジストリにプッシュ

最初は[jx create](https://jenkins-x.io/commands/jx_create_quickstart/)を使用して公式の例を作成し、GitHubにプッシュし、慣れてから徐々に変更することをお勧めします。

```
jx create spring -d web -d actuator
jx create quickstart -l java
jx create quickstart \
 -l java \
 --docker-registry-org zeusro \
 --git-username zeusro \
 --org  zeusro \
 --git-provider-kind gitea \
 --git-provider-url  https://gitea.com \
 --git-host  https://gitea.com  \
 --import-commit-message init \
 --name java-abcde \
 --project-name  java-abcde
```

## 前提条件

### https証明書チェックを無効化

証明書がないドメインの場合は、これをチェックしてください。パス：`Manage Jenkins`-`Configure System`

### Kubernetes Pod Templateを変更

`Jenkins`はJenkinsの作業ディレクトリ（サーバー）にプルしますが、`Jenkins-X`は設定されたテンプレートに基づいてpodを起動します。このpodには2つのコンテナがあり、1つは`jnlp-slave`で、もう1つはビルドツールイメージです。`gradle`ビルドの場合、イメージは`gcr.io/jenkinsxio/builder-gradle`です。

したがって、次のテンプレートが必要です。パス：`Manage Jenkins`-`Configure System`-`Images`-`Kubernetes Pod Template`、特定のビルド言語に従って移行し、変更します。


### 依存関係の加速

- maven加速

```xml
<?xml version="1.0" encoding="utf-8"?>
<settings xmlns="https://maven.apache.org/SETTINGS/1.0.0" xmlns:xsi="https://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd">
  <mirrors>
    <mirror>
      <id>alimaven</id>
      <mirrorOf>central</mirrorOf>
      <name>aliyun maven</name>
      <url>http://maven.aliyun.com/nexus/content/repositories/central/</url>
    </mirror>
  </mirrors>
  <profiles>
    <profile/>
  </profiles>
</settings>
```

- gradle加速

```
allprojects {
    apply plugin: 'maven'
    group = 'com.hh.onekey'
    version = '2.0.0'
}
subprojects {
    apply plugin: 'java'
    sourceCompatibility = 1.8
    targetCompatibility = 1.8

    repositories {
        mavenLocal()
        maven { url 'https://maven.aliyun.com/nexus/content/groups/public/' }
        maven { url 'https://maven.aliyun.com/nexus/content/repositories/jcenter' }
        maven { url "https://plugins.gradle.org/m2/" }
    }


    dependencies {
        testCompile group: 'junit', name: 'junit', version: '4.12'
    }
}

allprojects {
    repositories {
        mavenLocal()
        maven { url 'https://maven.aliyun.com/nexus/content/groups/public/' }
        maven { url 'https://maven.aliyun.com/nexus/content/repositories/jcenter' }
        maven { url "https://plugins.gradle.org/m2/" }
    }
}
```


## ビルドの前提条件

3つのアプローチがあります。いずれかを選択してください。最初のものが推奨されます。

### [推奨]mvn localに配信

このアイデアは、キャッシュをビルドする際に思いつきました。通常のpipelineビルドプロセスでは、各ビルドはゼロから始まるサンドボックスで、ビルド前にパッケージを再ダウンロードする必要があります。トラフィックを非常に無駄にします。したがって、mvnlocalをコンテナ内にマウントすると、ローカルで直接復元でき、問題がある場合はネットワークからプルできます。

これにより、`ビルドの前提条件`と`オープンソース依存関係のプル`の両方の問題を解決できます。

現在サポートされているボリュームは：

1. PVC
1. NFS
1. hostpath

NFSが推奨されます。

gradle：`/root/.gradle/caches`にマウント

maven：`/root/.mvnrepository`にマウント


### Nexusに配信

todo

### 他のパイプラインに関連付け

todo

## 他のgitサーバー（gitea）からコードをプル

```bash
jx create git server gitea http://xxx:1080
# jx delete git server gitea
jx get git
```

現在、削除コマンドはまだかなり愚かで、タイプ別にのみ削除できます。giteaタイプのgitサーバーが2つ追加された場合、削除時に最初に作成されたgiteaサーバーが削除されます。




## dockerイメージをビルド

ビルドは、プロジェクト内の`Jenkinsfile`と`Dockerfile`に依存します。

`Jenkinsfile`の構文については、別の記事で説明します。


## dockerイメージをカスタムレジストリにプッシュ

- DOCKER_REGISTRを変更

デフォルトの設定は、`Jenkins-X`を作成したときに確立されたdocker REGISTRYにプッシュすることです。これを独自のサーバーに変更する必要があります。

設定パス：`Manage Jenkins`-`Global properties`

DOCKER_REGISTRY変数を変更

```
# 阿里云深圳vpc
registry-vpc.cn-shenzhen.aliyuncs.com/
```

- [jx create docker](https://jenkins-x.io/commands/jx_create_docker/)

```bash
jx create docker auth \
--host "registry-vpc.cn-shenzhen.aliyuncs.com" \
--user "foo" --secret "FooDockerHubToken" \
--email "fakeemail@gmail.com"
```

その後、この`Jenkins-X`インスタンスがデプロイされているkubernetes名前空間に、`jenkins-docker-cfg`という名前のシークレットが表示されます。このシークレットはjsonです。

```json
{
	"auths": {
		"registry-vpc.cn-shenzhen.aliyuncs.com": {
			"auth": "xxxxxxxxxx",
			"email": "fakeemail@gmail.com"
		}
	}
}
```

コンテナがこのjson内のauthフィールドを通じてdockerレジストリにログインできるようにします。

したがって、このシークレットもコンテナ内にマウントする必要があります。幸い、デフォルトのpodテンプレートはすでにこのステップを設定しています。

![Image](/img/in-post/jenkins-x-build-java/volume-jenkins-docker-cfg.png)


これ以外に、他の[認証方法](https://github.com/jenkins-x/jx-docs/blob/master/content/architecture/docker-registry.md)もあります。


## 参考リンク：

1. [Jenkins Xビルド例](https://github.com/jenkins-x-buildpacks/jenkins-x-kubernetes/tree/master/packs)
1. [pod-templates](https://github.com/jenkins-x/jx-docs/blob/master/content/architecture/pod-templates.md)
1. [Kubernetesベースの弾性CI/CDシステムの実践](https://yq.aliyun.com/articles/690403)
