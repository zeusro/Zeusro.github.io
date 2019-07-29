FROM node:12-alpine
LABEL author=Zeusro site=https://github.com/theme-next/hexo-theme-next.git
# aliyun mirror
RUN apk add git npm install hexo-cli -g 

WORKDIR /app

ADD . /app

EXPOSE 4000
ENTRYPOINT ["hexo", "server"]
