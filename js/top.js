function goTop(speedFactor, delay, callback) {
    
        speedFactor = speedFactor || 0.1;
        delay = delay || 16;
        var currentScrollLeft = 0,
        currentScrollTop = 0,
        bodyScrollLeft = 0,
        bodyScrollTop = 0,
        windowScrollX = 0,
        windowScrollY = 0;
        document.documentElement && (currentScrollLeft = document.documentElement.scrollLeft || 0, currentScrollTop = document.documentElement.scrollTop || 0);
        document.body && (bodyScrollLeft = document.body.scrollLeft || 0, bodyScrollTop = document.body.scrollTop || 0);
        windowScrollX = window.scrollX || 0;
        windowScrollY = window.scrollY || 0;
        currentScrollLeft = Math.max(currentScrollLeft, Math.max(bodyScrollLeft, windowScrollX));
        currentScrollTop = Math.max(currentScrollTop, Math.max(bodyScrollTop, windowScrollY));
        var scrollDivisor = 1 + speedFactor;
        window.scrollTo(Math.floor(currentScrollLeft / scrollDivisor), Math.floor(currentScrollTop / scrollDivisor));
        0 < currentScrollLeft || 0 < currentScrollTop ? window.setTimeout('goTop(' + speedFactor + ', ' + delay + ')', delay) : 'undefined' != typeof callback && callback()
  
}
