## Установка программного обеспечения
* .NET Core Windows Server Hosting Bundle

Модуль ASP.NET Core — это модуль IIS 7.5+, который обрабатывает управление процессами для HTTP-слушателя ASP.NET Core и проксирует запросы к процессам, которыми он управляет. В настоящее время установка модуля ASP.NET Core для IIS является ручным процессом. Необходимо установить [.NET Core Windows Server Hosting Bundle](https://aka.ms/dotnetcore-2-windowshosting) на обычном (не Nano) компьютере.

* Установка патчей

[Update for Universal C Runtime in Windows](https://support.microsoft.com/en-us/help/2999226/update-for-universal-c-runtime-in-windows)

* Другая конфигурация

1. Переменная окружения ASPNETCORE_ENVIRONMENT, установленная в Production, указывает, что сервер читает конфигурацию производственной среды из appsettings.Development.json
2. 

## Публикация исходного кода
```
dotnet publish E:\xxx\project.csproj 
/p:PublishProfile="E:\xxx\Properties\PublœishProfiles\jenkins.pubxml" 
/p:Configuration=Release 
-o E:\jenkins 
-v detailed  
--force 
-c Release 
-r win8-x64

# Упрощенная команда
# dotnet publish -c Release -r win8-x64 -o E:\jenkins 
```

## Конфигурация IIS
Ссылки для справки объясняют это очень четко. Главное — установить пул приложений на "No Managed Code" и использовать скомпилированную директорию в качестве веб-директории. Если возникают проблемы, обратитесь к ссылке Troubleshoot для решения.

## Ссылки:
1. [Каталог .NET Core RID](https://docs.microsoft.com/zh-cn/dotnet/core/rid-catalog)
2. [Размещение ASP.NET Core в Windows с IIS](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/iis/index?tabs=aspnetcore2x)
3. [Amazing ASP.NET Core 2.0](http://www.cnblogs.com/savorboard/p/aspnetcore2-feature.html)
4. [Размещение ASP.NET Core в Windows с IIS](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/iis/index?tabs=aspnetcore2x#iis-configuration)
5. [dotnet publish](https://docs.microsoft.com/zh-cn/dotnet/core/tools/dotnet-publish?tabs=netcore2x)
6. [Справочник по конфигурации модуля ASP.NET Core](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/aspnet-core-module#aspnet-core-module-with-an-iis-shared-configuration)
7. [Устранение неполадок ASP.NET Core в IIS](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/iis/troubleshoot)
8. [Профили публикации Visual Studio для развертывания приложения ASP.NET Core](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/visual-studio-publish-profiles?tabs=aspnetcore2x)
9. [Использование нескольких сред](https://docs.microsoft.com/zh-cn/aspnet/core/fundamentals/environments)
10.
