Я импульсивно купил [новый домен](www.zeusro.com), поэтому пришлось изменить настройки блога. Поскольку я раньше использовал Alibaba Cloud DNS, теперь я переношу его в Cloudflare.

1. Изменить настройки GitHub Pages, изменить пользовательский домен на новый домен и отключить enforce HTTPS (у Cloudflare есть собственный сертификат)
1. Найти сервер для прослушивания на порту 80, перенаправить весь трафик со старого домена на новый домен с 301. Я использовал Docker Nginx для этого.
1. Настроить поисковые системы, мигрировать сайт. Если HTTPS также прослушивался раньше, HTTPS также нужен 301 редирект.

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
