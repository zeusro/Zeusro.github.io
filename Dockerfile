FROM jekyll/jekyll:4.0.0

LABEL author=Zeusro site=https://github.com/theme-next/hexo-theme-next.git
ENV FULL_CHOWN='FULL_CHOWN'
ENV GIT_URL=https://github.com/zeusro/Zeusro.github.io.git

ADD . /srv/jekyll

ENTRYPOINT ["jekyll","serve","-w"]