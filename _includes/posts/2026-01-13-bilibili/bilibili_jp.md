## 2014-05-03 Bilibiliのトップへ戻るアンカーを取得

今日は何もすることがなく、Bilibiliをブラウジングしていて、そのアンカーマークをずっと狙っていました。決心して自分のものにしようと、作業を始めました。

個人的にはFirefox + Firebugでウェブページのコードを確認することを推奨しています。私は夜間版（nightly）を使用しています。これはFirefoxの毎日更新版です（推奨しません。時々1日に3回更新して再起動が必要で非常に面倒です）。

ウェブページのコード、CSS、画像は簡単に取得できます。欲しい場所をクリックするだけで、左側にコード、右側にCSSやその他の情報が表示されます。背景画像の場合は、パスを右クリックして新しいページで開いて保存すればOKです。

主な問題は、バインドされたJavaScriptイベントでした。最初はアンカーのdiv idを探していましたが、いくつか見つかったものの、イベントが見つかりませんでした。後でFirebugの使い方がわかると、ずっと簡単になりました。クリックタグはgoTop関数にバインドされています。Firebugのコンソールで「goTop」と入力し、「RUN」をクリックすると、その関数が表示されます。見つけた後、右クリックしてソースコードを整形し、コピーしやすくできます。「goTop()」と入力すると実行されます。違います。

Bilibiliのアンカーは非常に興味深いです。まず、その位置設定が優れており、現在のビューポート内の要素の相対オフセットに基づいて設定されます。次に、強制的にスクロールさせます。ページをクリックして関数が開始された後、下にスクロールしても、完全にトップに到達するまで全力でトップまでスクロールし続けます。

```html
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title></title>
    <script src="../Scripts/jquery-1.10.2.min.js"></script>
    <script>
        $(function () {
            $('body').append('<div id="gotop" onclick="goTop();"></div>');
            $(window).scroll(function () {
                300 < $(this).scrollTop() ?
                ($('#gotop').show(),
                $('#gotop').css('left', $('.z').offset().left + $('.z').width() + 20),
                $('#gotop').css('top', $(window).height() - 300))
                : $('#gotop').hide()
            });
            $(window).resize(function () {
                $('#gotop').css('left', $('.z').offset().left + $('.z').width() + 20)
            })
        });
        function goTop(u, t, r) {
            var scrollActivate = !0;
            if (scrollActivate) {
                u = u || 0.1;
                t = t || 16;
                var s = 0,
                q = 0,
                o = 0,
                p = 0,
                n = 0,
                j = 0;
                document.documentElement && (s = document.documentElement.scrollLeft || 0, q = document.documentElement.scrollTop || 0);
                document.body && (o = document.body.scrollLeft || 0, p = document.body.scrollTop || 0);
                n = window.scrollX || 0;
                j = window.scrollY || 0;
                s = Math.max(s, Math.max(o, n));
                q = Math.max(q, Math.max(p, j));
                p = 1 + u;
                window.scrollTo(Math.floor(s / p), Math.floor(q / p));
                0 < s || 0 < q ? window.setTimeout('goTop(' + u + ', ' + t + ')', t) : 'undefined' != typeof r && r()
            } else {
                scrollActivate = !0
            }
        }
    </script>
    <style>
        #gotop:hover {
            background-position: 0px -116px;
        }
        #gotop {
            width: 29px;
            height: 106px;
            position: fixed;
            display: none;
            cursor: pointer;
            background: url('go_to_top.png') no-repeat scroll 0px 0px transparent;
        }
    </style>
</head>
<body>
    <div class="z" style="border: 1px dashed; height: 2999px; width: 977px; margin: 0 auto;">
    </div>
</body>
</html>
```

![go_to_top.png](/img/in-post/bilibili/go_to_top.png)

## 2015-04-26 ブログ園、あなたのJavaScriptは素晴らしい

![ブログ園Q&Aスクリーンショット](/img/in-post/bilibili/cnblogs-71564.png)


## 2015-04-26 ブログ園にスムーズにページトップへ移動するアンカーとタグクラウドを追加

まず、私の目次は[marvin](http://www.cnblogs.com/marvin/p/ExtendWizNoteAutoNnavigation.html#autoid-5-2-0)の作品を基に二次開発したものです。そして、アンカー画像と目次が同じ画像上にあることに気づき、一緒に使用しました。

### トップへ戻るアンカー：

以前のBilibiliバージョンの関数を使用しました。ページをスムーズにスクロールでき、トップに到達する前に下にスクロールできません。詳細は参考リンクを参照してください。もちろん、JavaScriptには権限が必要なため、シンプルにaタグのhrefに#topを使用することもできますが、体験は少し劣ります。

そして、私は怠け者なので、アンカーの表示条件を目次の表示条件と同じにしました。つまり、マッチした要素のスクロールバートップからの相対オフセットが200を超えたときに表示されます。

### タグクラウド：

Googleで適当に見つけました。ベクターグラフィックを使用しています。

しかし、これには制限があります。インスタンス化関数は要素IDを使用する必要があります。そこで、タグエリアのulをdivでラップし、インスタンス化しました。インスタンス化が成功したとき、タグエリアとタイトルを非表示にし、canvasのアニメーションと表示を設定します。

```javascript
window.onload=function(){                      
    $("ul:first","#sidebar_categories").wrap("<div id='caonimagebi' style='display:block'></div>")  
    if(!$('#myCanvas').tagcanvas({
          textColour: '#519cea',
          outlineColour: '#404040',
          reverse: true,
          depth: 0.8,
          maxSpeed: 0.10
        },'caonimagebi')) {
          console.log("クソだ")
          $('#myCanvasContainer').hide(); 
        }
        else{
            $('#myCanvasContainer').css('display', 'block');    
            $('#myCanvas').tagcanvas("setspeed", [0.015, -0.05]);        
             $('#caonimagebi').css('display', 'none');                    
              $('.catListTitle:first-child','#sidebar_categories').empty();//エッセイカテゴリを削除  
        }   
               }
```

しかし、これには制限があります。onloadに書かれているため、少し不自然です。この機能が隠されたように表示され、調和していないことがわかります。これが私を狂わせる点です。

### 狂気：

なぜこのラッピング方法をonreadyに書くと機能しないのか、そしてオンラインでのみ機能しないのか、非常に興味深いです。ローカルでテストしましたが、ローカルでonreadyに書いたときはページが正常に動作しましたが、ブログ園にアップロードするとこのようになります。

[ブログ園、あなたのJavaScriptは素晴らしい](http://q.cnblogs.com/q/71564/)

### 備考：

1. ブログ園のファイルシステムはソフト削除、遅延更新です。つまり、ファイルを削除してもまだ存在します。ファイルを削除して同じ名前のファイルをアップロードすると、サーバー上のファイルはまだ古いバージョンのままなので、ファイル名と対応する参照ファイル名を手動で変更する必要があります。

2. この目次には一定の制限があります。つまり、h2、h3、h4です。メソッドはあまり堅牢に書かれておらず、目次の高さは可能な限り見出し数に基づいて計算し、上限を設定する必要がありますが、変更するのが面倒です。また、z-indexの問題もあります。これは特に注意が必要です。隣のアンカーとトップへ戻るを999に設定しました。

3. ブログ園にはjQueryが組み込まれているため、別途参照する必要はありません。

## 2026-01-13 備考

原文は私のブログ園の2つの記事と1つのQ&Aで、クローラーで取得し、少し修正しました。

2015-04-26 19:41
ブログ園にスムーズにページトップへ移動するアンカーとタグクラウドを追加
https://www.cnblogs.com/zeusro/p/4458222.html

2014-05-03 18:58 
Bilibiliのトップへ戻るアンカーを取得
https://www.cnblogs.com/zeusro/p/3705426.html

現在のBilibiliのトップへ戻るアンカーは10年前よりも劣っています。すでにこのプロジェクトに移植しました。

コミットリンクは [247c0101d65b9c580fadc40db32165d2ef84fe07](https://github.com/zeusro/Zeusro.github.io/commit/247c0101d65b9c580fadc40db32165d2ef84fe07)です。AIはjQueryの問題も修正しました。これも素晴らしいです。

### Chromeスクリーンショットスクリプト

Chromeの`--headless=new`モードを使用して全ページスクリーンショットを取得：

```powershell
$url = "https://q.cnblogs.com/q/71564"
$outputPath = "D:\Zeusro.github.io\img\in-post\bilibili\cnblogs-71564.png"
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

& $chromePath --headless=new --disable-gpu --window-size=1280,2000 --virtual-time-budget=10000 --screenshot=$outputPath $url
```

パラメータ説明：
- `--headless=new`: 新しいヘッドレスモードを使用
- `--disable-gpu`: GPUアクセラレーションを無効化
- `--window-size=1280,2000`: ウィンドウサイズを1280x2000ピクセルに設定。全ページをキャプチャするのに十分な高さ
- `--virtual-time-budget=10000`: ページに10秒の仮想時間予算を与え、すべてのコンテンツが読み込まれることを確保
- `--screenshot=$outputPath`: スクリーンショットの保存パスを指定

## 参考リンク：

[Bilibiliのトップへ戻るアンカーを取得](http://www.cnblogs.com/zeusro/p/3705426.html)

[WizNoteに美しいナビゲーション目次を追加する方法](http://www.cnblogs.com/marvin/p/ExtendWizNoteAutoNnavigation.html)

[http://www.goat1000.com/tagcanvas-functions.php](http://www.goat1000.com/tagcanvas-functions.php)
