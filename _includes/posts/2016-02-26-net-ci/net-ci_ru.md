* [Подготовка](#подготовка)
* [Глобальные настройки](#глобальные-настройки)
  * [Настройка плагина Git](#настройка-плагина-git)
  * [Настройка плагина MSBuild](#настройка-плагина-msbuild)
  * [Настройка плагина GitLab](#настройка-плагина-gitlab)
* [Конфигурация Job](#конфигурация-job)
  * [Проблемы с SSH](#проблемы-с-ssh)
  * [Управление исходным кодом](#управление-исходным-кодом)
  * [Триггеры](#триггеры)
  * [Сборка](#сборка)   
* [Уроки, выученные на горьком опыте](#уроки-выученные-на-горьком-опыте)
* [Изменение директории Jenkins](#изменение-директории-jenkins)
* [Некоторые настройки](#некоторые-настройки)
* [Выбор плагинов](#выбор-плагинов)
* [Обработка исключений](#обработка-исключений)
  * [Ошибка настройки параметров безопасности, из-за которой невозможно войти](#ошибка-настройки-параметров-безопасности-из-за-которой-невозможно-войти)
* [Ссылки](#ссылки)

![Image](/img/in-post/net-ci/ci_1.png)

## Подготовка

После установки не забудьте установить плагины MSBuild, GitLab и GitLab-hook.

На сервере необходимо установить среду .NET и Git.

## Глобальные настройки

- Git plugin

Просто заполните любое имя пользователя и email.

## Global Tool Configuration

Не знаю, когда это началось, но настройки плагинов переместились в это место. Здесь нужно настроить несколько вещей:

- MSBuild

![Image](/img/in-post/net-ci/msbuild设置.png)

- Git

В основном для настройки исполняемого файла Git. Поскольку я добавил его в PATH, я пропущу это.

## Credentials

Настройки учетных данных довольно необычны.

Нужно нажать (global), а затем нажать "Add Credentials" во всплывающем окне.

## Конфигурация Job

- Проблемы с SSH

Мы все знаем, что каждая команда Windows фактически имеет прикрепленную роль. Когда я использовал Git раньше, я обнаружил, что добавил SSH-приватный ключ на сервер, но git push не удался. Это было потому, что роль, которую мы использовали, имела проблемы.

Jenkins использует **Local System account**. При подключении к нашему проекту GitLab с помощью SSH-ключа необходимо скопировать папку .ssh из вашего системного пользователя в папку, используемую пользователем Jenkins.

Но перед этим нужно выполнить SSH (есть exe в директории установки Git) к нашему хосту GitLab:

```bash
ssh.exe -T git@192.1.1.123
```

После того, как убедитесь, что known_hosts содержит этот хост, скопируйте всю папку .ssh в **C:\Windows\SysWOW64\config\systemprofile** и **C:\Windows\System32\config\systemprofile**.

**Совет**

Если вы видите "permission denied", добавьте эту команду:

```bash
ssh-keygen -t rsa -C "robot233@robot.com"
```

Проверьте, в какой директории был добавлен known host, затем скопируйте ваш сгенерированный ключ в директорию, которая вызвала сбой.

- Управление исходным кодом

После установки необходимых плагинов, упомянутых выше, вы можете выбрать Git в разделе исходного кода. Здесь я использовал SSH, поэтому формат такой, как показано на изображении ниже:

![Image](/img/in-post/net-ci/job里面的git设置1.png)

**Важно:**

Не используйте SSH от пользователя компьютера для этих учетных данных. Мы знаем, что GitLab разрешает только один SSH на машину, и один и тот же SSH не может быть добавлен к нескольким учетным записям. Это создает проблему: нашей машине сборки нужно подключиться к проекту исходного кода, поэтому нужен SSH-ключ. Однако для скомпилированных результатов я использую Git для синхронизации директорий в Windows, поэтому нужен другой SSH для подключения к моей учетной записи робота. Если эти два SSH-ключа одинаковы, один шаг не удастся.

Браузер исходного кода фактически переходит к нашему соответствующему проекту GitLab, поэтому используйте HTTP:

![Image](/img/in-post/net-ci/job里面的git设置2.png)

- Триггеры

Это очень важно. После проверки и выбора в соответствии с нашими потребностями:

![Image](/img/in-post/net-ci/job里面的git设置3.png)

Скопируйте URL после "Build when a change is pushed to GitLab. GitLab CI Service URL".

Вернитесь к соответствующим настройкам проекта GitLab, заполните этот URL в Settings → Web Hooks, отметьте по необходимости и добавьте после подтверждения.

Таким образом, когда есть изменения в исходном коде на нашем GitLab, это вызовет web hook и скажет нашему CI приступить к работе.

![Image](/img/in-post/net-ci/添加WebHook.png)

- MSBuild

Здесь в основном нужно изучить синтаксис MSBuild. Когда я создавал этот CI, моя цель была чисто скомпилировать веб-сайты. Ниже приведены часто используемые и очень понятные:

```text
/p:PublishProfile="F:xxxxx.pubxml"
/p:DeployOnBuild=true
/p:Configuration=Release
/p:VisualStudioVersion=12.0  
/property:TargetFrameworkVersion=v4.5
```

Файл pubxml генерируется, когда мы выбираем публикацию. Вы можете проверить его сами, и это очень понятно.

Я рекомендую запустить MSBuild один раз на вашей машине разработки.

Обычно наш MSBuild находится в **cd C:\Windows\Microsoft.NET\Framework64\v4.0.30319\**

Затем:

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

Моя рекомендуемая конфигурация:

```bash
/p:PublishProfile="C:\xxxxx.pubxml" \
/p:DeployOnBuild=true \
/p:Configuration=Release \
/p:VisualStudioVersion=12.0 \
/property:TargetFrameworkVersion=v4.5 \
/verbosity:n \
/maxcpucount:16
```

После компиляции и развертывания на сервере, как правило, все должно быть в порядке.

Но у меня **были проблемы!!!!**

- Проблемы с NuGet Feed

Поскольку мой проект использует мои приватные пакеты NuGet, которые нельзя найти в официальном источнике NuGet, мне нужно настроить свой собственный feed на CI-сервере, как в VS.

Найдите NuGet.Config в **C:\Windows\SysWOW64\config\systemprofile\AppData\Roaming\NuGet** и измените на:

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
    <add key="Мой приватный feed" value="D:\nuget" />     
  </packageSources>
  <activePackageSource>
    <add key="All" value="(Aggregate source)" />
  </activePackageSource>
</configuration>
```

- Проблемы с ошибками компиляции

Это недопустимо. На моем компьютере все работало отлично, но сервер абсолютно отказывался компилировать. Позже я сосредоточился на проверке сторонних DLL и моих приватных пакетов NuGet в программе и обнаружил, что все ошибки были там. Причина, по которой я не заметил на машине разработки, заключалась в том, что зависимости NuGet на машине разработки имели локальный кэш. Компиляция напрямую пропускала их. После 35 попыток моя программа наконец успешно скомпилировалась на CI.

- Проблемы с правами Git - не может клонировать проект

Это ошибка конфигурации job. В конфигурации Git job выберите "SSH Username with private key", введите приватный ключ напрямую и полностью скопируйте содержимое из ~/.ssh/id_rsa. Это включает бессмысленные разделители в начале и конце!

## Уроки, выученные на горьком опыте

- Не используйте **test hook** GitLab

В то время у моего проекта было 2 ветки. Я хотел сгенерировать из определенной ветки, но нажал test hook. Черт, содержимое главной ветки было полностью вытянуто.

## Обработка исключений

### Anonymous не имеет разрешения Overall/Administer

http://stackoverflow.com/questions/22833665/hudson-security-accessdeniedexception2-anonymous-is-missing-the-overall-admini

### Ошибка настройки параметров безопасности, из-за которой невозможно войти

Изменить:

```xml
<authorizationStrategy class="hudson.security.AuthorizationStrategy$Unsecured"/>
```

```bash
cd директория jenkins
# Перезапуск
jenkins restart   # Forces
```

## Изменение директории Jenkins

> Остановить службу Jenkins

> Переместить папку C:\Users\Coola\.jenkins в d:\Jenkins

> Используя regedit, изменить HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Jenkins\ImagePath на "d:\Jenkins\jenkins.exe"

> Запустить службу

## Некоторые настройки

- Это разрешение соответствует "Любой пользователь может делать что угодно (без ограничений)"

```xml
<authorizationStrategy class="hudson.security.AuthorizationStrategy$Unsecured"/>
```

- Это разрешение соответствует "Вошедшие пользователи могут делать что угодно"

```xml
<authorizationStrategy class="hudson.security.FullControlOnceLoggedInAuthorizationStrategy"/>
```

## Выбор плагинов

| Имя плагина      | Назначение                          | URL введения                                                      |
| ---------------- | ----------------------------------- | ------------------------------------------------------------------ |
| proxy            | Прокси                              |                                                                    |
| gitlab           | Для интеграции с GitLab             | https://wiki.jenkins-ci.org/display/JENKINS/GitLab+Plugin          |
| publish-over-ssh | Подключение к другим Linux-машинам через SSH |                                                                    |
| Mercurial        | Инструмент сборки                   | https://wiki.jenkins-ci.org/display/JENKINS/Mercurial+Plugin      |
| gitlab-hook      | Позволяет использовать Gitlab web hooks для запуска SMC опроса проектов Gitlab | https://wiki.jenkins-ci.org/display/JENKINS/GitLab+Hook+Plugin |

## Ссылки

1. [Отключить безопасность](https://wiki.jenkins-ci.org/display/JENKINS/Disable+security)
2. [Настройка разрешений](http://www.cnblogs.com/zz0412/p/jenkins_jj_14.html)
3. [Создание CI с GitLab + Jenkins](http://zipperary.com/2015/07/10/%E7%94%A8-gitlab-+-jenkins-%E6%90%AD%E5%BB%BA-ci/?utm_source=tuicool&utm_medium=referral)
4. [Среда автоматической сборки, тестирования и развертывания Jenkins .NET](http://blog.csdn.net/wangjia184/article/details/18365553)
5. [Создание среды непрерывной интеграции (CI) с Jenkins+Gitlab](http://hyhx2008.github.io/li-yong-jenkinsgitlabda-jian-chi-xu-ji-cheng-cihuan-jing.html)
6. [Создание среды непрерывной интеграции с MSBuild и Jenkins (1)](http://www.infoq.com/cn/articles/MSBuild-1)
7. [Создание среды непрерывной интеграции с MSBuild и Jenkins (2)](http://www.infoq.com/cn/articles/MSBuild-2)
8. [Продвинутая серия Jenkins](http://www.cnblogs.com/zz0412/tag/jenkins/)
9. [Интеграция Jenkins CI](http://doc.gitlab.com/ee/integration/jenkins.html)
10. [Документация GitLab](http://doc.gitlab.com/ce/ci/quick_start/README.html)
11. [Настройка вашего репозитория для Jenkins CI](https://github.com/dotnet/dotnet-ci/blob/master/docs/CI-SETUP.md)
12. [Jenkins git clone via SSH на Windows 7 x64](http://computercamp-cdwilson-us.tumblr.com/post/48589650930/jenkins-git-clone-via-ssh-on-windows-7-x64)
13. [Создание службы непрерывной интеграции с Jenkins](http://chenpeng.info/html/3081?utm_source=tuicool)
14. [Размещение собственных NuGet Feeds](https://docs.nuget.org/create/hosting-your-own-nuget-feeds)
15. [Использование MSBuild.exe для «публикации» проекта ASP.NET MVC 4 с командной строки](http://stackoverflow.com/questions/13920146/using-msbuild-exe-to-publish-a-asp-net-mvc-4-project-with-the-cmd-line)
16. [Заметки о настройке среды разработки проекта (5. Настройка Jenkins)](http://blog.csdn.net/fbysss/article/details/44087185)
17. [MSBuild DeployOnBuild=true не публикует](http://stackoverflow.com/questions/4962705/msbuild-deployonbuild-true-not-publishing)
18. [Как изменить папку Jenkins по умолчанию в Windows](http://stackoverflow.com/questions/12689139/how-to-change-jenkins-default-folder-on-windows)
19. [Переменные окружения Jenkins](https://wiki.jenkins-ci.org/display/JENKINS/Building+a+software+project#Buildingasoftwareproject-JenkinsSetEnvironmentVariables)
