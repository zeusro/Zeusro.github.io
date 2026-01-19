## 2014-05-03 Scraping Bilibili's Back-to-Top Anchor

Today I was idly browsing Bilibili and had been eyeing that anchor mark for a long time. I decided to make it my own, so I got to work.

I mainly use Firefox + Firebug to inspect webpage code. I'm using Nightly, Firefox's daily update version (not recommended, sometimes it updates three times a day and restarts are very annoying).

Webpage code, CSS, and images are easy to get. Just click where you want, left side shows code, right side shows CSS and other stuff. For background images, right-click the path and open it in a new page to save.

The main trouble was the bound JavaScript events. I was initially stupidly searching for the anchor's div id, found some things but couldn't find the event. Later, when I learned to use Firebug properly, it became much easier. The click tag is bound to the goTop function. In Firebug's console, type "goTop", then click "RUN", and the function will appear. After finding it, you can right-click to beautify the source code for easy copying. Typing "goTop()" executes it. It's different.

Bilibili's anchor is quite interesting. First, its position is set well, adjusting based on the element's relative offset in the current viewport. Second, it forces scrolling - after clicking and the function starts, even if you scroll down, it will still scroll to the top with all its might until it fully reaches the top.

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

## 2015-04-26 CNBlogs, Your JavaScript is Amazing

![CNBlogs Q&A Screenshot](/img/in-post/bilibili/cnblogs-71564.png)


## 2015-04-26 Adding Smooth Scroll-to-Top Anchor and Tag Cloud to Your CNBlogs

First, my table of contents is based on [marvin](http://www.cnblogs.com/marvin/p/ExtendWizNoteAutoNnavigation.html#autoid-5-2-0)'s work, which I further developed. Then I found that the anchor image and table of contents are on the same image, so I used them together.

### Back-to-Top Anchor:

I used the function from the old Bilibili version. It can smoothly scroll to the page top, and prevents scrolling down before reaching the top. See my reference link for details. Of course, since it involves JavaScript that requires permissions, you can simply use an anchor tag with href="#top", but the experience is a bit poor.

Then because I'm lazy, I made the anchor's appearance condition the same as the table of contents. That is, it shows when the matched element's offset relative to the scrollbar top exceeds 200.

### Tag Cloud:

I found it randomly on Google. Uses vector graphics.

But this thing has a limitation - its instantiation function requires an element ID. So I wrapped the tag area's ul with a div, then instantiated it. When instantiation succeeds, hide the tag area and title, set the canvas animation and display.

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
          console.log("Damn it")
          $('#myCanvasContainer').hide(); 
        }
        else{
            $('#myCanvasContainer').css('display', 'block');    
            $('#myCanvas').tagcanvas("setspeed", [0.015, -0.05]);        
             $('#caonimagebi').css('display', 'none');                    
              $('.catListTitle:first-child','#sidebar_categories').empty();//Remove essay categories  
        }   
               }
```

But this has a limitation - because it's written in onload, it's a bit abrupt. You can see this thing appears like it was hidden, not harmonious. This is what drives me crazy.

### Going Crazy:

I'm just very curious why this wrapping method doesn't work when written in onready, and it only fails online. I did test locally, and when written in onready locally, the page works normally, but when uploaded to CNBlogs it becomes like this.

[CNBlogs, Your JavaScript is Amazing](http://q.cnblogs.com/q/71564/)

### Notes:

1. CNBlogs' file system is soft delete, slow update. That is, when you delete a file it's still there. If you delete a file and upload a file with the same name, the server file is still the old version, so you need to manually change the filename and the corresponding reference filename.

2. This table of contents has certain limitations, namely h2, h3, h4. The method isn't written very robustly, and the table of contents height should be calculated based on the number of headings as much as possible, then set an upper limit, but I'm too lazy to change it. Also, there's the z-index issue. This needs special attention. I set the anchor and back-to-top next to it to 999.

3. CNBlogs comes with jQuery built-in, so no need to reference it separately.

## 2026-01-13 Notes

The original text consists of 2 articles and 1 Q&A from my CNBlogs, which I scraped and slightly modified.

2015-04-26 19:41
Adding Smooth Scroll-to-Top Anchor and Tag Cloud to Your CNBlogs
https://www.cnblogs.com/zeusro/p/4458222.html

2014-05-03 18:58 
Scraping Bilibili's Back-to-Top Anchor
https://www.cnblogs.com/zeusro/p/3705426.html

Now Bilibili's back-to-top anchor is worse than 10 years ago. I've already ported it to this project.

The commit link is [247c0101d65b9c580fadc40db32165d2ef84fe07](https://github.com/zeusro/Zeusro.github.io/commit/247c0101d65b9c580fadc40db32165d2ef84fe07). AI also fixed the jQuery issue, which is also amazing.

### Chrome Screenshot Script

Using Chrome's `--headless=new` mode for full-page screenshots:

```powershell
$url = "https://q.cnblogs.com/q/71564"
$outputPath = "D:\Zeusro.github.io\img\in-post\bilibili\cnblogs-71564.png"
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

& $chromePath --headless=new --disable-gpu --window-size=1280,2000 --virtual-time-budget=10000 --screenshot=$outputPath $url
```

Parameter explanation:
- `--headless=new`: Use the new headless mode
- `--disable-gpu`: Disable GPU acceleration
- `--window-size=1280,2000`: Set window size to 1280x2000 pixels, large enough height to capture the full page
- `--virtual-time-budget=10000`: Give the page 10 seconds of virtual time budget to ensure all content is loaded
- `--screenshot=$outputPath`: Specify the screenshot save path

## References:

[Scraping Bilibili's Back-to-Top Anchor](http://www.cnblogs.com/zeusro/p/3705426.html)

[How to Add a Beautiful Navigation Table of Contents to Your WizNote](http://www.cnblogs.com/marvin/p/ExtendWizNoteAutoNnavigation.html)

[http://www.goat1000.com/tagcanvas-functions.php](http://www.goat1000.com/tagcanvas-functions.php)
