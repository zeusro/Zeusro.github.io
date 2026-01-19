## 2014-05-03 Извлечение якоря возврата наверх Bilibili

Сегодня мне было нечего делать, я просматривал Bilibili и давно засматривался на эту якорную метку. Решил сделать её своей, поэтому приступил к работе.

Лично я рекомендую Firefox + Firebug для просмотра кода веб-страниц. Я использую Nightly, ежедневную обновляемую версию Firefox (не рекомендуется, иногда обновляется три раза в день, перезапуски очень раздражают).

Код веб-страницы, CSS и изображения легко получить. Просто кликайте где хотите, слева код, справа CSS и прочее. Для фоновых изображений просто правой кнопкой мыши по пути, откройте в новой странице и сохраните.

Основная проблема была в привязанных событиях JavaScript. Сначала я тупо искал div id якоря, нашёл кое-что, но никак не мог найти событие. Позже, когда научился использовать Firebug, стало намного проще. Тег клика привязан к функции goTop. В консоли Firebug введите "goTop", затем нажмите "RUN", и функция появится. После нахождения можно правой кнопкой мыши форматировать исходный код для удобного копирования. Ввод "goTop()" выполняет её. Это другое.

Якорь Bilibili довольно интересен. Во-первых, его позиция установлена хорошо, настраивается в зависимости от относительного смещения элемента в текущем окне просмотра. Во-вторых, он заставляет прокручивать - после клика и начала работы функции, даже если вы прокручиваете вниз, он всё равно будет прокручивать наверх изо всех сил, пока полностью не достигнет верха.

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

## 2015-04-26 CNBlogs, ваш JavaScript потрясающий

![Скриншот Q&A CNBlogs](/img/in-post/bilibili/cnblogs-71564.png)


## 2015-04-26 Добавление плавного якоря возврата наверх и облака тегов в ваш CNBlogs

Сначала мое оглавление основано на работе [marvin](http://www.cnblogs.com/marvin/p/ExtendWizNoteAutoNnavigation.html#autoid-5-2-0), которую я доработал. Затем я обнаружил, что изображение якоря и оглавление находятся на одном изображении, поэтому использовал их вместе.

### Якорь возврата наверх:

Я использовал функцию из старой версии Bilibili. Она может плавно прокручивать страницу наверх и предотвращает прокрутку вниз до достижения верха. Подробности смотрите в моей ссылке. Конечно, поскольку это связано с JavaScript, требующим разрешений, можно просто использовать тег якоря с href="#top", но опыт будет немного хуже.

Затем, поскольку я ленив, я сделал условие появления якоря таким же, как у оглавления. То есть, оно показывается, когда смещение совпадающего элемента относительно верха полосы прокрутки превышает 200.

### Облако тегов:

Я нашёл это случайно в Google. Использует векторную графику.

Но у этой штуки есть ограничение - её функция инициализации требует ID элемента. Поэтому я обернул ul области тегов в div, затем инициализировал. При успешной инициализации скрываю область тегов и заголовок, устанавливаю анимацию и отображение canvas.

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
          console.log("Чёрт возьми")
          $('#myCanvasContainer').hide(); 
        }
        else{
            $('#myCanvasContainer').css('display', 'block');    
            $('#myCanvas').tagcanvas("setspeed", [0.015, -0.05]);        
             $('#caonimagebi').css('display', 'none');                    
              $('.catListTitle:first-child','#sidebar_categories').empty();//Удалить категории эссе  
        }   
               }
```

Но это имеет ограничение - поскольку написано в onload, это немного резко. Вы можете видеть, что эта штука появляется как будто была скрыта, не гармонично. Это то, что сводит меня с ума.

### Схожу с ума:

Мне просто очень любопытно, почему этот метод обёртки не работает, когда написан в onready, и это не работает только онлайн. Я тестировал локально, и когда написал в onready локально, страница работала нормально, но при загрузке на CNBlogs становится так.

[CNBlogs, ваш JavaScript потрясающий](http://q.cnblogs.com/q/71564/)

### Примечания:

1. Файловая система CNBlogs - это мягкое удаление, медленное обновление. То есть, когда вы удаляете файл, он всё ещё там. Если вы удалите файл и загрузите файл с тем же именем, файл на сервере всё ещё старая версия, поэтому нужно вручную изменить имя файла и соответствующее имя файла ссылки.

2. Это оглавление имеет определённые ограничения, а именно h2, h3, h4. Метод написан не очень надёжно, и высота оглавления должна быть рассчитана на основе количества заголовков, насколько это возможно, затем установить верхний предел, но мне лень это менять. Также есть проблема z-index. Это требует особого внимания. Я установил якорь и возврат наверх рядом с ним на 999.

3. CNBlogs поставляется со встроенным jQuery, поэтому не нужно ссылаться на него отдельно.

## 2026-01-13 Примечания

Оригинальный текст состоит из 2 статей и 1 Q&A из моего CNBlogs, которые я извлёк с помощью краулера и слегка изменил.

2015-04-26 19:41
Добавление плавного якоря возврата наверх и облака тегов в ваш CNBlogs
https://www.cnblogs.com/zeusro/p/4458222.html

2014-05-03 18:58 
Извлечение якоря возврата наверх Bilibili
https://www.cnblogs.com/zeusro/p/3705426.html

Теперь якорь возврата наверх Bilibili хуже, чем 10 лет назад. Я уже перенёс его в этот проект.

Ссылка на коммит: [247c0101d65b9c580fadc40db32165d2ef84fe07](https://github.com/zeusro/Zeusro.github.io/commit/247c0101d65b9c580fadc40db32165d2ef84fe07). AI также исправил проблему jQuery, что тоже удивительно.

### Скрипт скриншота Chrome

Использование режима `--headless=new` Chrome для полностраничных скриншотов:

```powershell
$url = "https://q.cnblogs.com/q/71564"
$outputPath = "D:\Zeusro.github.io\img\in-post\bilibili\cnblogs-71564.png"
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

& $chromePath --headless=new --disable-gpu --window-size=1280,2000 --virtual-time-budget=10000 --screenshot=$outputPath $url
```

Объяснение параметров:
- `--headless=new`: Использовать новый режим без интерфейса
- `--disable-gpu`: Отключить ускорение GPU
- `--window-size=1280,2000`: Установить размер окна 1280x2000 пикселей, достаточно большая высота для захвата полной страницы
- `--virtual-time-budget=10000`: Дать странице 10 секунд виртуального времени, чтобы убедиться, что весь контент загружен
- `--screenshot=$outputPath`: Указать путь сохранения скриншота

## Ссылки:

[Извлечение якоря возврата наверх Bilibili](http://www.cnblogs.com/zeusro/p/3705426.html)

[Как добавить красивую навигационную таблицу содержания в ваш WizNote](http://www.cnblogs.com/marvin/p/ExtendWizNoteAutoNnavigation.html)

[http://www.goat1000.com/tagcanvas-functions.php](http://www.goat1000.com/tagcanvas-functions.php)
