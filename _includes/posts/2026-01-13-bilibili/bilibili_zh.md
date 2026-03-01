## 2014-05-03 去把bilibili的返回顶点锚点扒了下来

今天闲来无事看着刷着bilibili对那锚点标记觊觎已久，下决心将其收为己用，遂动手。

个人主推Firefox+firebug查看网页代码。我用的是夜壶(nightly)，就火狐的每日更新版(建议不用，有时一日三更重启非常蛋疼).

网页代码，css和图片容易弄，哪里想要点哪里，左边是代码，右边是css和其他，背景图的话，右键路径在新页面打开保存就行。

主要是绑定的javascript事件麻烦。楼主一开始傻BB就对着那个锚点的divid找啊找，找到了一些但死活找不到事件。后来firebug会用了就简单多了。点击标签绑定的是goTop函数，在firebug的控制栏里输入"goTop"，然后点"RUN"，那个函数就会出现了，找到之后还可以右键美化源代码，方便复制过去。输"goTop()"的话是执行。不一样的。

bilibili的锚点是挺有趣的， 首先其位置设置的不错，会根据元素在当前视口的相对偏移设置，其次是它让人流氓滚，在点了页面开始调用函数之后一旦你往下滚轮它还是会用生命滚到页首，直到完全触顶为止。

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

## 2015-04-26 博客园，你们家的js好神奇

![博客园问答截图](/img/in-post/bilibili/cnblogs-71564.png)


## 2015-04-26 为你的博客园添加平滑移动到页面顶端的锚点和tag云

首先我的目录是在[marvin](http://www.cnblogs.com/marvin/p/ExtendWizNoteAutoNnavigation.html#autoid-5-2-0)的基础上二次开发的。然后我发现锚点图和目录都在同一个图上面，所以就一起用了。

### 返回顶部锚点:

我用以前旧版bilibili的那个函数。可以做到平滑滚动到页面，并且在触顶前不能向下滚屏。具体的看我参考链接。当然因为涉及到js要申请权限，简单的话a标签href用#top当然可以，体验有点差罢了。

然后因为我懒，锚点的出现条件直接和目录的出现条件弄在一起。也就是匹配元素相对滚动条顶部的偏移超过200时显示。

### tag云:

我用Google随便找的。用的矢量绘图。

但是这玩意有个局限性，就是其实例化函数限制要用元素ID.于是我用一个div包裹了标签区的ul.然后实例化。实例化成功的时候隐藏掉标签区和标题，设置canvas的蠕动和显示

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
          console.log("日了狗了")
          $('#myCanvasContainer').hide(); 
        }
        else{
            $('#myCanvasContainer').css('display', 'block');    
            $('#myCanvas').tagcanvas("setspeed", [0.015, -0.05]);        
             $('#caonimagebi').css('display', 'none');                    
              $('.catListTitle:first-child','#sidebar_categories').empty();//去掉随笔分类  
        }   
               }
```

但是这样有个局限性，就是因为写在onload里面，有点生硬，你们可以看到，这玩意像是隐搞出来的，不和谐。这就是让我抓狂的地方了。

### 抓狂:

我就是很好奇，为毛这个包裹方法写在onready里面就不行了，而且是线上的时候不行。我是有在本地测试的，本地写在onready的时候页面很正常，传到博客园就变成这样。

[博客园，你们家的js好神奇](http://q.cnblogs.com/q/71564/)

### 备注:

1博客园的文件系统是软删除，慢更新。就是你删了文件还在，你删了那个文件上传同名文件的话，服务器上的文件还是旧版的，所以需要自己手动修改文件名和相应的引用文件名。

2这个目录有一定的局限性，也就是h2,h3,h4.方法写的不是很健壮，而且目录的高度应该尽可能的根据标题数来计算，然后弄个上限，但是我也懒得改了。还有就是z-index的问题。这个要格外注意下。我是把旁边的锚点和返回顶部设置为999了。

3博客园自带jQuery.所以无需另外引用

## 2026-01-13 备注

原文是我在博客园的2篇文章和1个问答，我用爬虫扒了下来，并稍微修改了一下。

2015-04-26 19:41
为你的博客园添加平滑移动到页面顶端的锚点和tag云
https://www.cnblogs.com/zeusro/p/4458222.html

2014-05-03 18:58 
去把bilibili的返回顶点锚点扒了下来
https://www.cnblogs.com/zeusro/p/3705426.html

现在B站的返回顶点锚点还不如10年前。我已经把它移植到我这个项目中。

提交链接是 [247c0101d65b9c580fadc40db32165d2ef84fe07](https://github.com/zeusro/Zeusro.github.io/commit/247c0101d65b9c580fadc40db32165d2ef84fe07)。AI还顺便修复了jQuery的问题，也是神奇了。

### Chrome 截图脚本

使用 Chrome 的 `--headless=new` 模式进行全页面截图：

```powershell
$url = "https://q.cnblogs.com/q/71564"
$outputPath = "D:\Zeusro.github.io\img\in-post\bilibili\cnblogs-71564.png"
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

& $chromePath --headless=new --disable-gpu --window-size=1280,2000 --virtual-time-budget=10000 --screenshot=$outputPath $url
```

参数说明：
- `--headless=new`: 使用新的无头模式
- `--disable-gpu`: 禁用 GPU 加速
- `--window-size=1280,2000`: 设置窗口大小为 1280x2000 像素，足够大的高度可以捕获完整页面
- `--virtual-time-budget=10000`: 给页面 10 秒的虚拟时间预算，确保所有内容都加载完成
- `--screenshot=$outputPath`: 指定截图保存路径

## 参考链接:

[去把bilibili的返回顶点锚点扒了下来](http://www.cnblogs.com/zeusro/p/3705426.html)

[如何给你的为知笔记添加一个漂亮的导航目录](http://www.cnblogs.com/marvin/p/ExtendWizNoteAutoNnavigation.html)

[http://www.goat1000.com/tagcanvas-functions.php](http://www.goat1000.com/tagcanvas-functions.php)
