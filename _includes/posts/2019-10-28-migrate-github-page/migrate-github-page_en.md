I impulsively bought a [new domain](www.zeusro.com), so I had to change the blog settings. Since I had been using Alibaba Cloud DNS before, I'm now transferring it to Cloudflare.

1. Modify GitHub Pages settings, change the custom domain to the new domain, and disable enforce HTTPS (Cloudflare has its own certificate)
1. Find a server to listen on port 80, redirect all traffic from the old domain to the new domain with 301. I used Docker Nginx for this.
1. Set up search engines, migrate the site. If HTTPS was also being listened to before, HTTPS also needs 301 redirect.

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
