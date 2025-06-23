FROM jekyll/jekyll:4.2.2

LABEL author=Zeusro site=https://www.zeusro.com
ENV FULL_CHOWN='FULL_CHOWN'
ENV GIT_URL=https://github.com/zeusro/Zeusro.github.io.git

ADD . /srv/jekyll

ENTRYPOINT ["jekyll","serve","-w","--trace"]