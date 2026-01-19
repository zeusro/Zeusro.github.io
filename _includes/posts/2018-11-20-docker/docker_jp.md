## インストール

### Ubuntu

```bash
# SET UP THE REPOSITORY
sudo apt-get remove docker docker-engine docker.io
sudo apt-get update
sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo apt-key fingerprint 0EBFCD88
 sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
# INSTALL DOCKER CE
 sudo apt-get update
 sudo apt-get install docker-ce
apt-cache madison docker-ce
# 阿里云公司镜像
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://vhc6pxhv.mirror.aliyuncs.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker

```

```bash
sudo curl -L https://github.com/docker/compose/releases/download/1.21.2/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version

```
参考:
1. https://docs.docker.com/compose/install/#install-compose
2. 

### mac

```
brew cask install docker
docker ps
docker-machine create default

```

## コマンド

###  run 
```
 docker run [OPTIONS] IMAGE [COMMAND] [ARG...]  
  -a, --attach=[]            コンテナにログイン（docker run -dで起動したコンテナ）  
  -c, --cpu-shares=0         コンテナのCPU重みを設定、CPU共有シナリオで使用  
  --cap-add=[]               権限を追加、権限リストの詳細：http://linux.die.net/man/7/capabilities  
  --cap-drop=[]              権限を削除、権限リストの詳細：http://linux.die.net/man/7/capabilities  
  --cidfile=""               コンテナ実行後、指定ファイルにコンテナPID値を書き込む、典型的な監視システムの使用方法  
  --cpuset=""                コンテナが使用できるCPUを設定、このパラメータはコンテナ専用CPUに使用可能  
  -d, --detach=false         コンテナをフォアグラウンドまたはバックグラウンドで実行するか指定   
  --device=[]                ホストデバイスをコンテナに追加、デバイスパススルーに相当  
  --dns=[]                   コンテナのdnsサーバーを指定  
  --dns-search=[]            コンテナのdns検索ドメインを指定、コンテナの/etc/resolv.confファイルに書き込む  
  -e, --env=[]               環境変数を指定、コンテナ内でこの環境変数を使用可能  
  --entrypoint=""            イメージのエントリーポイントを上書き  
  --env-file=[]              環境変数ファイルを指定、ファイル形式は1行に1つの環境変数  
  --expose=[]                コンテナが公開するポートを指定、つまりイメージの公開ポートを変更  
  -h, --hostname=""          コンテナのホスト名を指定  
  -i, --interactive=false    STDINを開く、コンソール対話用  
  --link=[]                  コンテナ間の関連を指定、他のコンテナのIP、envなどを使用  
  --lxc-conf=[]              コンテナの設定ファイルを指定、--exec-driver=lxcが指定されている場合のみ使用  
  -m, --memory=""            コンテナのメモリ上限を指定  
  --name=""                  コンテナ名を指定、後で名前でコンテナを管理可能、links機能は名前を使用する必要がある  
  --net="bridge"             コンテナネットワーク設定、詳細は後述  
  -P, --publish-all=false    コンテナが公開するポートを指定、詳細は後述  
  -p, --publish=[]           コンテナが公開するポートを指定、詳細は後述  
  --privileged=false         コンテナが特権コンテナかどうかを指定、特権コンテナはすべてのcapabilitiesを持つ  
  --restart=""               コンテナ停止後の再起動戦略を指定、詳細は後述  
  --rm=false                 コンテナ停止後自動的にコンテナを削除（docker run -dで起動したコンテナはサポートされない）  
  --sig-proxy=true           プロキシが信号を受け取り処理するように設定、ただしSIGCHLD、SIGSTOP、SIGKILLはプロキシできない  
  -t, --tty=false            ttyデバイスを割り当て、ターミナルログインをサポート可能  
  -u, --user=""              コンテナのユーザーを指定  
  -v, --volume=[]            コンテナにストレージボリュームをマウント、コンテナの特定のディレクトリにマウント  
  --volumes-from=[]          他のコンテナのボリュームをコンテナにマウント、コンテナの特定のディレクトリにマウント  
  -w, --workdir=""           コンテナの作業ディレクトリを指定  


# bashターミナルを起動し、ユーザー対話を許可
docker run -t -i ubuntu:14.04 /bin/bash

# 終了したコンテナを起動  
docker container start
```

* --restartパラメータは、3つの論理実装をサポート：
```
no：コンテナ終了時に再起動しない  
on-failure：コンテナがエラーで終了（戻り値がゼロ以外）時に再起動  
always：コンテナ終了時に常に再起動
```

* ネットワークパラメータ --net
 
```bash
--net=bridge： //docker daemonが指定したブリッジを使用
--net=host： //コンテナがホストのネットワークを使用
--net=container:NAME_or_ID：//他のコンテナのネットワークを使用、IPとPORTなどのネットワークリソースを共有
--net=none： //コンテナが独自のネットワークを使用（--net=bridgeに類似）、ただし設定しない
```

* 最も簡単な例
 
```bash
docker run --name myredis -d redis
```

###  build
```
docker build -t runoob/ubuntu:v1 .
```

### 組み込み監視

```bash
# {% raw %}
  docker stats $(docker ps --format={{.Names}})
# {% endraw %}  
```

参考:
[docker stats](https://docs.docker.com/engine/reference/commandline/stats/)

## いくつかの落とし穴

### dockerにはネットワークボトルネックがあり、` --net=host`で解決できます。
>    Dockerがサポートするネットワークモード：
> 
>    none。コンテナ内のネットワーク接続を閉じる  
> 
>    bridge。vethインターフェースを通じてコンテナを接続、デフォルト設定。
> 
>    host。コンテナがホストのネットワークスタック情報を使用することを許可。注意：この方法により、コンテナがホスト内のD-BUSなどのシステムサービスにアクセスできるようになるため、安全でないと見なされる。
> 
>   container。別のコンテナのネットワークスタック情報を使用。　
* 



### macOSでDocker daemonに接続できない
```
brew cask install docker
``` 

### ADD命令を控えめに使用

ADDの別の機能は、圧縮ファイルを自動的に解凍できることです。パラメータが圧縮形式（tar、gzip、bzip2など）を認識するローカルファイルの場合、コンテナファイルシステムの指定場所に解凍されます。

参考リンク：
[Dockerfile:ADD VS COPY](https://juejin.im/post/5aa5d08e6fb9a028de4455d1)

### entrypointで実行されるコンテナは[Unix信号](https://zh.wikipedia.org/wiki/Unix%E4%BF%A1%E5%8F%B7)を受信できない

entrypointがsh -cで実行されると、アプリケーションのpid!=1になる

## 要点:
* すべてのファイル書き込み操作は、データボリューム（Volume）、またはホストディレクトリのバインドを使用すべきです。これらの場所での読み書きはコンテナストレージレイヤーをスキップし、ホスト（またはネットワークストレージ）に直接読み書きし、パフォーマンスと安定性が向上します。
* したがって、CentOS/RHELユーザーにとって、UnionFSを使用できない場合、パフォーマンス、安定性、またはスペース利用率のいずれのためであっても、devicemapperにdirect-lvmを設定する必要があります。
* イメージを構築する際、`&&`で命令を接続し、最後に余分なファイルをクリーンアップする必要がある
* Dockerfileを空のディレクトリ、またはプロジェクトのルートディレクトリに配置すべき
* ディレクトリ内の一部のものは、実際にビルド時にDockerエンジンに渡したくない場合、.gitignoreと同じ構文で.dockerignoreを書くことができる
* 


1. [Alpine Linux Docker Imageを体験](https://blog.phpgao.com/docker_alpine.html)

## いくつかのヒント

### イメージタグを表示

```
brew install httpie
http -a <ユーザー名>:<パスワード> https://auth.docker.io/token  service==registry.docker.io scope==repository:library/nginx:pull
# コマンド結果のtokenを$tokenに置き換える
http https://registry.hub.docker.com/v2/library/nginx/tags/list 'Authorization: Bearer $token'

```

参考

[OAuth方式でdocker hub v2 APIと対話](https://yq.aliyun.com/articles/635236?spm=a2c4e.11155435.0.0.70446906jG4z8L)


### Google containerのタグを表示

[コマンドライン方式](https://cloud.google.com/sdk/gcloud/reference/container/images/list-tags)


[インターフェース方式](https://gcr.io/v2/google-containers/pause/tags/list)

[ウェブ方式](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL)


### コンテナが使用する一時ストレージを表示

```bash
docker ps
docker inspect <containerid>
```

結果はjsonで、`GraphDriver`フィールドの内容がこのコンテナの読み書きレイヤーが占有するスペースです

[overlay2](https://docs.docker.com/storage/storagedriver/overlayfs-driver/#how-the-overlay2-driver-works)このストレージドライバーは、大体このようになります

```
        "GraphDriver": {
            "Data": {
                "LowerDir": "/var/lib/docker/overlay2/a37aa91098cae96ea46461786e1fe5e737e6a9f6659aaecae03cb1a6649f2ec5-init/diff:/var/lib/docker/overlay2/bc8e51a75f0c75a4c99aee3365e61d819db62c40567d19065803f604c37b037c/diff:/var/lib/docker/overlay2/c6b772109941ef801751cc79df1fff5365d802313e62d891709fa5dc0a77e5ee/diff:/var/lib/docker/overlay2/57825e2f123ee01d2a0316633797eea092d456e86313e57f387f55984539fa12/diff:/var/lib/docker/overlay2/85a562eb1efa7fb47d73c1f3a872eff792e2897fb10acc7f5c3a36a949267ea8/diff:/var/lib/docker/overlay2/175ef167c94fabfcdd71c9c0c00cf84aff09092c525a23eb34ef1abdc5353315/diff:/var/lib/docker/overlay2/7f3e18afdbf72eef8cf3c3c85be17fd690bd8d08ab845351f13e2ab9373f7116/diff:/var/lib/docker/overlay2/6587c9c58d7fbeaa3b2d485033cea9ed16b5e58f5ffb1ab52cbf0ce5d10015db/diff:/var/lib/docker/overlay2/7a5a3316ee39f485f5834604b4ed2943864935601cb53d1ff4e61523236fd7e3/diff:/var/lib/docker/overlay2/e823c204b197123caf2cb190a4a7eb6b1664ef91610578cd3a9230edd9948711/diff:/var/lib/docker/overlay2/5ee74f69388ee558000e54fab92d7f245e38cbcb74d1d428e6e8acb1d84d5785/diff:/var/lib/docker/overlay2/a716238ee065c05799244c3bd375ecc3132f3039f4e041254a150b4900b43c84/diff:/var/lib/docker/overlay2/8cf97acec90c72c19d9efe245d7196a27903c2593d64c34d4fd68c0f3244afe3/diff:/var/lib/docker/overlay2/d31d19d7f6dae649f5318546dd374b7c332dbdab01bc61b7e47bafec0f1a33e9/diff",
                "MergedDir": "/var/lib/docker/overlay2/a37aa91098cae96ea46461786e1fe5e737e6a9f6659aaecae03cb1a6649f2ec5/merged",
                "UpperDir": "/var/lib/docker/overlay2/a37aa91098cae96ea46461786e1fe5e737e6a9f6659aaecae03cb1a6649f2ec5/diff",
                "WorkDir": "/var/lib/docker/overlay2/a37aa91098cae96ea46461786e1fe5e737e6a9f6659aaecae03cb1a6649f2ec5/work"
```

ストレージドライバーについて、[この記事](http://dockone.io/article/1765)はかなりよく説明しています

### コンテナをクリーンアップ

クリーンアップ前後で次のコマンドを使用して効果を比較

  docker system df -v

#### 方式1


```bash
    # 別の方法として、停止（Exited）状態のすべてのコンテナを削除するには、次のコマンドを使用できます：
    docker rm -v $(docker ps -a -q -f status=exited)
    #（いわゆる）ダングリングボリュームを削除するには、次のコマンドを入力する必要があります：
    docker volume rm $(docker volume ls -qf dangling=true)
    # 最後に、クリーンアップタスクが完了したことを確認するために、次のコマンドを入力します：
    docker volume ls -qf dangling=true | xargs -r docker volume rm
```


```bash
#! /bin/sh は、このスクリプトが/bin/shを使用して解釈および実行することを意味し、#!は特殊な表示子で、その後に続くのはこのスクリプトを解釈するshellのパスです
#!/bin/bash
docker rmi $ (docker images -q -f dangling=true)
docker volume rm $(docker volume ls -qf dangling=true)
0 0 1 ~/docker_clean.sh > /dev/null 2>&1
```

```bash
chmod 755 ~/docker_clean.sh
# USERは実際のユーザー名
sudo usermod -aG docker USER
# ログアウトして再ログイン後、次のコマンドを入力してcronジョブを作成します
crontab –e
# crontabファイルを保存して閉じます。その後、毎日深夜12時に、Dockerが自動的にクリーンアップタスクを実行し、クリーンで整頓されたDockerを体験できます。

```
参考:[4つの実用的なヒントでDockerを「大掃除」しましょう](https://yq.aliyun.com/articles/279136?spm=a2c4e.11153959.0.0.16b9d55awTBOj5)


####  【強く推奨】方式2

```
docker system prune -a
docker system prune --volumes
```

### OOMトラブルシューティング

```bash
grep -i OOM -A 5 -B 5 /var/log/messages
docker ps -a | grep 5c223ed
```

```bash
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: Tasks state (memory values in pages):
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  pid  ]   uid  tgid total_vm      rss pgtables_bytes swapents oom_score_adj name
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  26934]     0 26934      411      128    40960        0           937 entrypoint.sh
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  26981]     0 26981    48758     1814   118784        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  26982] 65534 26982    69086    25949   323584        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  26983] 65534 26983    70117    26791   331776        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  26986] 65534 26986    68812    25937   323584        0           937 php-fpm7
--
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  23381] 65534 23381    51941     8278   184320        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  29842] 65534 29842    51729     8041   180224        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  29854] 65534 29854    50988     7278   176128        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  30426] 65534 30426    52385     8720   184320        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [    317] 65534   317    51335     7618   176128        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: oom-kill:constraint=CONSTRAINT_NONE,nodemask=(null),cpuset=docker-5c223edfde3b17676cb982efdc201218a674578704d33d09de4775b721cb4702.scope,mems_allowed=0,oom_memcg=/kubepods.slice/kubepods-burstable.slice/kubepods-burstable-podef7ce918_ae07_11e9_bf64_00163e08cd06.slice/docker-5c223edfde3b17676cb982efdc201218a674578704d33d09de4775b721cb4702.scope,task_memcg=/kubepods.slice/kubepods-burstable.slice/kubepods-burstable-podef7ce918_ae07_11e9_bf64_00163e08cd06.slice/docker-5c223edfde3b17676cb982efdc201218a674578704d33d09de4775b721cb4702.scope,task=php-fpm7,pid=26865,uid=65534
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: Memory cgroup out of memory: Killed process 26865 (php-fpm7) total-vm:367860kB, anon-rss:177544kB, file-rss:1720kB, shmem-rss:13216kB
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: oom_reaper: reaped process 26865 (php-fpm7), now anon-rss:0kB, file-rss:0kB, shmem-rss:13216kB
```

`5c223edfde3b17676cb982efdc201218a674578704d33d09de4775b721cb4702` これがOOMが発生したコンテナIDです

## [Dockerfile ヒント](https://mp.weixin.qq.com/s?__biz=MzI1OTY2MzMxOQ==&mid=2247486135&idx=2&sn=0136343fedfb03d18ecd52f4b0297250&chksm=ea743e0fdd03b719a4e31b0bf508d305c8ea95595fa6f94d1d149a1f39af950a97a08c21b831&mpshare=1&scene=23&srcid=0722hfZqf9tVS6zNAMxua63c#rd)

変更されるレイヤーを最後に、キャッシュ可能なレイヤーを前に

```
apt-get -y install -–no-install-recommends
rm -rf /var/lib/apt/lists/*
```

## PIDでコンテナ情報を検索

```bash
{% raw %}
  docker ps -q | xargs docker inspect --format '{{.State.Pid}}, {{.ID}}, {{.Name}}, {{.Config.Image}}' | grep "^${PID},"
{% endraw %}
```

PS: docker inspectのコマンド結果はjsonで、最初はformatを追加せず、その後自分でフォーマットを定義できます

参考リンク:
[CoreOS - get docker container name by PID?](https://stackoverflow.com/questions/24406743/coreos-get-docker-container-name-by-pid)

## docker ps  ソート

```bash
{% raw %}

docker ps --format "table {{.ID}}\t{{.Image}}" | (read -r; printf "%s\n" "$REPLY"; sort -k 2 )

docker ps [--format="TEMPLATE"]

--format="TEMPLATE"
  Goテンプレートを使用してコンテナをきれいに印刷します。
  有効なプレースホルダー:
     .ID - コンテナID
     .Image - イメージID
     .Command - 引用されたコマンド
     .CreatedAt - コンテナが作成された時刻。
     .RunningFor - コンテナが起動してからの経過時間。
     .Ports - 公開されたポート。
     .Status - コンテナのステータス。
     .Size - コンテナのディスクサイズ。
     .Names - コンテナ名。
     .Labels - コンテナに割り当てられたすべてのラベル。
     .Label - このコンテナの特定のラベルの値。例：{{.Label "com.docker.swarm.cpu"}}
     .Mounts - このコンテナにマウントされたボリュームの名前。

{% endraw %}
```

[参考リンク](https://stackoverflow.com/questions/46173298/how-to-sort-or-order-results-docker-ps-format)

## もう学べない

dockerコマンドを学べない？問題ありません、[lazydocker](https://github.com/jesseduffield/lazydocker)が手伝います。わからないところをクリックするだけで、お母さんはもう私のdockerの問題を心配する必要がありません。

## 参考リンク:

1. [Docker基礎-コンテナ間の通信を理解する](https://kevinguo.me/2017/08/23/Docker-container-communication/)
2. [【docker】docker runコマンドの詳細説明](https://blog.csdn.net/one_clouder/article/details/39224767)
3. [dockerを起動するときにdocker内のプロジェクトにパラメータを渡す方法](https://blog.csdn.net/wsbgmofo/article/details/79173920)
4. [Docker使用時のネットワークボトルネック](http://wiki.jikexueyuan.com/project/openresty/web/docker.html)
5. [docker-compose.ymlの書き方、Docker compose file参考ドキュメント](https://deepzz.com/post/docker-compose-file.html)
6. [Docker Volumeの深い理解（一）](http://dockone.io/article/128)
7. [Use volumes](https://docs.docker.com/storage/volumes/)
8. [Docker コンテナ（Container）の管理](https://itbilu.com/linux/docker/4kkTyS8Pf.html#docker-inspect)
9. [Install Docker Compose](https://docs.docker.com/compose/install/)
