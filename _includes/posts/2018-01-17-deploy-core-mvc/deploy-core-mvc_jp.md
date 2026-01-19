## ソフトウェアのインストール
* .NET Core Windows Server ホスティングバンドル

ASP.NET CoreモジュールはIIS 7.5+モジュールで、ASP.NET Core HTTPリスナーのプロセス管理を処理し、管理するプロセスにリクエストをプロキシします。現在、IIS用のASP.NET Coreモジュールのインストールは手動プロセスです。通常の（Nanoではない）コンピューターに[.NET Core Windows Server ホスティングバンドル](https://aka.ms/dotnetcore-2-windowshosting)をインストールする必要があります。

* パッチのインストール

[Update for Universal C Runtime in Windows](https://support.microsoft.com/en-us/help/2999226/update-for-universal-c-runtime-in-windows)

* その他の設定

1. 環境変数ASPNETCORE_ENVIRONMENTをProductionに設定し、サーバーが本番環境のappsettings.Development.jsonの設定を読み取ることを示します
2. 

## ソースコードの公開
```
dotnet publish E:\xxx\project.csproj 
/p:PublishProfile="E:\xxx\Properties\PublœishProfiles\jenkins.pubxml" 
/p:Configuration=Release 
-o E:\jenkins 
-v detailed  
--force 
-c Release 
-r win8-x64

# 簡略化されたコマンド
# dotnet publish -c Release -r win8-x64 -o E:\jenkins 
```

## IIS設定
参考リンクで非常に明確に説明されています。主な点は、アプリケーションプールを「マネージドコードなし」に設定し、コンパイルされたディレクトリをWebディレクトリとして使用することです。問題が発生した場合は、Troubleshootリンクを参照して処理してください。

## 参考リンク:
1. [.NET Core RID カタログ](https://docs.microsoft.com/zh-cn/dotnet/core/rid-catalog)
2. [IISを使用してWindowsでASP.NET Coreをホスト](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/iis/index?tabs=aspnetcore2x)
3. [Amazing ASP.NET Core 2.0](http://www.cnblogs.com/savorboard/p/aspnetcore2-feature.html)
4. [IISを使用してWindowsでASP.NET Coreをホスト](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/iis/index?tabs=aspnetcore2x#iis-configuration)
5. [dotnet 公開](https://docs.microsoft.com/zh-cn/dotnet/core/tools/dotnet-publish?tabs=netcore2x)
6. [ASP.NET Coreモジュール設定リファレンス](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/aspnet-core-module#aspnet-core-module-with-an-iis-shared-configuration)
7. [IISでのASP.NET Coreのトラブルシューティング](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/iis/troubleshoot)
8. [ASP.NET Coreアプリのデプロイメント用Visual Studio公開プロファイル](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/visual-studio-publish-profiles?tabs=aspnetcore2x)
9. [複数の環境を使用](https://docs.microsoft.com/zh-cn/aspnet/core/fundamentals/environments)
10.
