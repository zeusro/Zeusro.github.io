function goTop(speedFactor, delay, callback) {
    // 设置默认参数值
    speedFactor = speedFactor || 0.1;
    delay = delay || 16;
    
    // 获取当前滚动位置（兼容不同浏览器）
    var scrollLeftFromElement = 0;
    var scrollTopFromElement = 0;
    var scrollLeftFromBody = 0;
    var scrollTopFromBody = 0;
    var scrollXFromWindow = 0;
    var scrollYFromWindow = 0;
    
    if (document.documentElement) {
        scrollLeftFromElement = document.documentElement.scrollLeft || 0;
        scrollTopFromElement = document.documentElement.scrollTop || 0;
    }
    
    if (document.body) {
        scrollLeftFromBody = document.body.scrollLeft || 0;
        scrollTopFromBody = document.body.scrollTop || 0;
    }
    
    scrollXFromWindow = window.scrollX || 0;
    scrollYFromWindow = window.scrollY || 0;
    
    // 取最大值作为当前滚动位置
    var currentScrollLeft = Math.max(
        scrollLeftFromElement,
        Math.max(scrollLeftFromBody, scrollXFromWindow)
    );
    var currentScrollTop = Math.max(
        scrollTopFromElement,
        Math.max(scrollTopFromBody, scrollYFromWindow)
    );
    
    // 如果已经到达顶部，执行回调并返回
    if (currentScrollLeft === 0 && currentScrollTop === 0) {
        if (typeof callback === 'function') {
            callback();
        }
        return;
    }
    
    // 计算滚动除数（用于平滑滚动）
    var scrollDivisor = 1 + speedFactor;
    
    // 执行滚动
    window.scrollTo(
        Math.floor(currentScrollLeft / scrollDivisor),
        Math.floor(currentScrollTop / scrollDivisor)
    );
    
    // 递归调用，继续滚动
    window.setTimeout(function() {
        goTop(speedFactor, delay, callback);
    }, delay);
}