衝動的に[新しいドメイン](www.zeusro.com)を購入したので、ブログの設定も変更する必要がありました。以前は阿里雲DNSを使用していたため、Cloudflareに移行しています。

1. GitHub Pagesの設定を変更し、カスタムドメインを新しいドメインに変更し、enforce HTTPSを無効にします（Cloudflareには独自の証明書があります）
1. ポート80でリッスンするサーバーを見つけ、古いドメインからのすべてのトラフィックを新しいドメインに301リダイレクトします。これにはDocker Nginxを使用しました。
1. 検索エンジンを設定し、サイトを移行します。以前にHTTPSもリッスンしていた場合、HTTPSも301リダイレクトが必要です。

```yaml
version: '2.2'
services:
    blog:
      image: nginx
      ports:
      - "80:80"
      - "443:443"
      volumes:
      - "/root/migrate/nginx.conf:/etc/nginx/nginx.conf"
```

```conf
user  nginx;
worker_processes auto;
pid /run/nginx.pid;
#daemon off;

events {
        worker_connections 768;
        multi_accept on;
}

http {

server {
    listen       80 ;
    server_name  www.zeusro.tech zeusro.tech;
    return       301 https://www.zeusro.com$request_uri;
}

}
```
