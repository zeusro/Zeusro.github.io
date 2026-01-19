Недавно из-за проблемы с эпидемией при доступе к GitHub не только аватары пользователей не отображаются, но и выполнение кода с `raw.githubusercontent.com` (домен хостинга статических файлов GitHub) напрямую взрывается с 443. Это делает работу всех довольно неудобной.

Поэтому я собрал и организовал текущие решения, пытаясь решить проблему из источника.

## Понимание проблемы

### Домены, связанные с GitHub

**IP-адреса в HOST неверны, пожалуйста, не копируйте и не вставляйте напрямую!**

```host
# GitHub Start
192.30.253.112 github.com
192.30.253.119 gist.github.com
151.101.228.133 assets-cdn.github.com
151.101.228.133 raw.githubusercontent.com
151.101.228.133 gist.githubusercontent.com
151.101.228.133 cloud.githubusercontent.com
151.101.228.133 camo.githubusercontent.com
151.101.228.133 avatars0.githubusercontent.com
151.101.228.133 avatars1.githubusercontent.com
151.101.228.133 avatars2.githubusercontent.com
151.101.228.133 avatars3.githubusercontent.com
151.101.228.133 avatars4.githubusercontent.com
151.101.228.133 avatars5.githubusercontent.com
151.101.228.133 avatars6.githubusercontent.com
151.101.228.133 avatars7.githubusercontent.com
151.101.228.133 avatars8.githubusercontent.com
192.30.253.116  api.github.com
# GitHub End
```

### Корневая причина

Крупномасштабное загрязнение DNS-хайджекинга, разрешенный японский IP 151.101.228.133 имеет серьезную потерю пакетов.

```bash
ping 151.101.228.133
......
--- 151.101.228.133 ping statistics ---
2661 packets transmitted, 2309 packets received, 13.2% packet loss
round-trip min/avg/max/stddev = 69.550/117.602/230.267/21.696 ms
```

## Решения с прокси

### Самостоятельно изменить файл PAC

#### Изменить локальный PAC

Из вышеизложенного, домены, связанные с GitHub:

```
github.com
*.github.com
*.githubusercontent.com
```

PAC Paper Airplane на стороне Windows — это локальный файл;

Paper Airplane на стороне mac можно редактировать напрямую, один домен на строку, принцип аналогичен, если не понимаете, просто скопируйте и вставьте ~

[V2rayU](https://github.com/yanue/V2rayU) аналогично

#### Обновить локальное разрешение DNS

```bash
# MAC (OS X 10.11+ )
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
# window
ipconfig /flushdns
```

### Режим автоматического переключения SwitchyOmega (применимо к V2rayU)

Используйте "режим сценария PAC" для настройки режима сценария v2.

Затем установите режим автоматического переключения и используйте его.

![img](/img/in-post/github/SwitchyOmega.png)


Если переключиться на
[V2RayX](https://github.com/Cenmrev/V2RayX/releases)
, не нужно так много хлопот, можно напрямую редактировать pac, но автор не обновлял много недавно.


## Решения без прокси

### Изменить host

На
https://www.ipaddress.com/
найдите IP-адреса США для github.com и других доменов, затем привяжите их к HOST.
**Это ручная работа**.

Внутренние могут быть неточными, но могут служить справочной информацией:
1. https://tool.lu/dns/index.html
1. http://tool.chinaz.com/dns/

Расположение файла системы Windows: `C:/windows/system32/drivers/etc/hosts`

Файл системы mac находится в /etc/hosts

Рекомендуется использовать [SwitchHosts](https://github.com/oldj/SwitchHosts/releases)
для управления файлами host

Продвинутое решение — написать программу для динамического обновления HOST путем вызова веб-интерфейсов.

```host
# raw.githubusercontent.com — это домен хостинга статических файлов GitHub
199.232.28.133 raw.githubusercontent.com
```

Я спешил использовать код с `raw.githubusercontent.com`, поэтому изменил его на IP США, затем получил доступ через прокси.

### Расширение браузера Chrome

Найдите и установите **GitHub Accelerator**, и все готово. Они используют транзитный внутренний домен для клонирования, избегая проблемы разрешения DNS.

## Ускорение git

Ссылается на решение [chuyik](https://gist.github.com/chuyik)


### Протокол SSH с использованием SSH-туннеля для прокси (mac, Linux)

Добавьте свой ssh на зарубежную машину, xx.xx.xx.xx — это публичный IP машины.

Затем добавьте IP машины в конфигурацию ssh `~/.ssh/config`:

```
Host github.com raw.githubusercontent.com
    ProxyCommand  ssh root@xx.xx.xx.xx nc %h %p
```

После этого добавьте публичный ключ вашего клиента на удаленный GitHub. Это вступит в силу только при клонировании репозиториев с использованием протокола ssh.

    git clone git@github.com:owner/git.git

### Протокол http(s) с использованием локального прокси + git config

```bash
# Использовать HTTP-прокси
git config --global http.proxy "http://127.0.0.1:8080"
git config --global https.proxy "http://127.0.0.1:8080"
# Использовать socks5-прокси (например, Shadowsocks)
git config --global http.proxy "socks5://127.0.0.1:1080"
git config --global https.proxy "socks5://127.0.0.1:1080"
# Отменить настройки
git config --global --unset http.proxy
git config --global --unset https.proxy
# Наконец проверьте конфигурацию
git config --list --global
git config --list --system
```

     git clone https://github.com/owner/git.git

## ssh через flclash

Напишите это в вашей конфигурации SSH (~/.ssh/config):

```
Host github.com
    HostName ssh.github.com
    Port 443
    User git
    # Если вы используете socks5-прокси
    ProxyCommand nc -x 127.0.0.1:7890 %h %p
```

Здесь ssh.github.com — это адрес GitHub для SSH-over-443.  ￼

nc -x хост:порт %h %p использует nc (netcat) для пересылки SSH через SOCKS5-прокси. -x указывает тип прокси (socks), измените в соответствии с вашим локальным портом прокси flclash. ProxyCommand SSH Config может заставить SSH-трафик проходить через прокси.  ￼

ServerAliveInterval и другие параметры также можно добавить, чтобы предотвратить прерывание простоя соединения.

```bash
git config --global url."https://github.com/".insteadOf "git@github.com:"
ssh ssh.github.com
Please type 'yes', 'no' or the fingerprint: yes
Warning: Permanently added '[ssh.github.com]:443' (ED25519) to the list of known hosts.
```

Чтобы избежать блокировки SSH-порта 22, GitHub дополнительно предоставляет SSH-службу на порту 443, поэтому отпечаток его публичного ключа также отличается.
После ввода yes git push больше не будет иметь проблем с разрывом соединения.

## Окончательное решение

Грин-карта США

![img](/img/逃.jpg)

Последнее слово,
[Недавно кто-то восстановил весь процесс атаки клиента протокола ss](https://www.leadroyal.cn/?p=1036)

## Ссылки

1. [Изменить Hosts для временного решения проблемы подключения raw.githubusercontent.com GitHub](https://www.ioiox.com/archives/62.html)
1. [Решение проблем с доступом к GitHub в Китае](http://rovo98.coding.me/posts/7e3029b3/)
1. [Как установить прокси для Git?](https://segmentfault.com/q/1010000000118837)
1. [macOS Установить прокси (HTTP/SSH) для Git(Github)](https://gist.github.com/chuyik/02d0d37a49edc162546441092efae6a1)
