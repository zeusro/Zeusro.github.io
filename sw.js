/* ===========================================================
 * sw.js - Service Worker 主文件
 * ===========================================================
 * Copyright 2016 @huxpro
 * Licensed under Apache 2.0
 * Service Worker 脚本 - 提供离线缓存和网络请求拦截功能
 * ========================================================== */

/**
 * 缓存命名空间
 * CacheStorage 在同一域名下的所有站点之间共享
 * 使用命名空间可以防止潜在的命名冲突和误删除
 */
const CACHE_NAMESPACE = 'main-'

/**
 * 当前使用的缓存名称
 * 采用 "precache-then-runtime" 策略：预缓存 + 运行时缓存
 */
const CACHE = CACHE_NAMESPACE + 'precache-then-runtime'

/**
 * 预缓存列表
 * 这些资源会在 Service Worker 安装时立即缓存
 * 包括：首页、离线页面、核心 JS/CSS 文件、关键图片等
 */
const PRECACHE_LIST = [
  "./",
  "./offline.html",
  "./js/jquery.min.js",
  "./js/bootstrap.min.js",
  "./js/hux-blog.min.js",
  "./js/snackbar.js",
  //"./img/icon_wechat.png",
  // "./img/avatar-hux.jpg",
  "./img/home-bg.jpg",
  "./img/404-bg.jpg",
  "./css/hux-blog.min.css",
  "./css/bootstrap.min.css"
  // "//cdnjs.cloudflare.com/ajax/libs/font-awesome/4.6.3/css/font-awesome.min.css",
  // "//cdnjs.cloudflare.com/ajax/libs/font-awesome/4.6.3/fonts/fontawesome-webfont.woff2?v=4.6.3",
  // "//cdnjs.cloudflare.com/ajax/libs/fastclick/1.0.6/fastclick.min.js"
]

/**
 * 主机名白名单
 * 只有来自这些域名的请求才会被 Service Worker 处理
 * 用于跳过跨域请求（如 Google Analytics）
 */
const HOSTNAME_WHITELIST = [
  self.location.hostname,
  "huangxuan.me",
  "yanshuo.io",
  "cdnjs.cloudflare.com"
]

/**
 * 已废弃的缓存名称列表
 * 在激活事件中会删除这些旧缓存，释放存储空间
 */
const DEPRECATED_CACHES = ['precache-v1', 'runtime', 'main-precache-v1', 'main-runtime']


/**
 * 工具函数：为请求 URL 添加缓存破坏参数
 * 
 * 作用：
 * 1. 修复 HTTP URL，使其与当前页面的协议保持一致（避免混合内容问题）
 * 2. 添加时间戳查询参数，绕过浏览器和 GitHub Pages 的缓存
 * 3. 保留多语言参数（lang），确保不同语言版本被正确缓存
 * 
 * GitHub Pages 使用 Cache-Control: max-age=600，这可能导致内容更新延迟
 * 通过添加 cache-bust 参数，强制获取最新内容
 * 
 * @param {Request} req - 原始请求对象
 * @returns {string} 添加了缓存破坏参数的 URL
 * 
 * @see https://bugs.chromium.org/p/chromium/issues/detail?id=453190
 */
const getCacheBustingUrl = (req) => {
  const now = Date.now()
  const url = new URL(req.url)

  // 1. 修复协议：确保与当前页面协议一致
  // fetch(httpURL) 属于混合内容，fetch(httpRequest) 目前还不支持
  url.protocol = self.location.protocol

  // 2. 添加缓存破坏查询参数，但保留 lang 参数
  // 使用时间戳确保每次请求都是唯一的
  // 重要：保留 lang 参数，确保不同语言版本被正确缓存和区分
  const params = new URLSearchParams(url.search)
  params.set('cache-bust', now.toString())
  url.search = params.toString()
  
  return url.href
}

/**
 * 工具函数：检测是否为导航请求（页面请求）
 * 
 * 说明：
 * - request.mode === 'navigate' 在 Chrome 49 以下版本不支持
 * - 因此需要回退方案：检查是否为 GET 请求且 Accept 头包含 text/html
 * 
 * @param {Request} req - 请求对象
 * @returns {boolean} 是否为导航请求
 */
const isNavigationReq = (req) => {
  return req.mode === 'navigate' || 
         (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'))
}

/**
 * 工具函数：检测 URL 路径是否以文件扩展名结尾
 * 
 * 说明：
 * - 根据 Fetch API 规范，HTML 导航请求的 mode="navigate", destination="document"
 * - 即使是直接从地址栏请求图片等静态资源，也会被视为导航请求
 * - 因此需要使用正则表达式来判断 URL 是否以扩展名结尾
 * - 注意：路径中没有 '.' 不能说明没有扩展名（如 /api/version/1.2/）
 * 
 * @param {Request} req - 请求对象
 * @returns {boolean} URL 路径是否以扩展名结尾
 * 
 * @see https://fetch.spec.whatwg.org/#concept-request-destination
 */
const endWithExtension = (req) => {
  return Boolean(new URL(req.url).pathname.match(/\.\w+$/))
}

/**
 * 工具函数：判断是否需要重定向
 * 
 * 问题背景：
 * GitHub Pages 在处理类似 "repo?blah" 的 URL 时会返回 404
 * 
 * 解决方案：
 * - repo?blah -> SW 302 重定向 -> repo/?blah（正确）
 * - .ext?blah -> 不应重定向（否则会导致 404）
 * 
 * 判断逻辑：
 * - 是导航请求
 * - 路径不以 '/' 结尾
 * - 路径不以扩展名结尾
 * 
 * @param {Request} req - 请求对象
 * @returns {boolean} 是否需要重定向
 * 
 * @see https://twitter.com/Huxpro/status/798816417097224193
 */
const shouldRedirect = (req) => {
  const url = new URL(req.url)
  return isNavigationReq(req) && 
         url.pathname.substr(-1) !== "/" && 
         !endWithExtension(req)
}

/**
 * 工具函数：获取重定向后的 URL
 * 
 * 说明：
 * - 不能直接使用 `${url}/`，这会在查询字符串末尾错误地添加 "/"
 * - 应该使用 URL 对象操作 pathname，然后重新生成 href
 * - 始终信任 url.pathname 而不是整个 URL 字符串
 * 
 * @param {Request} req - 请求对象
 * @returns {string} 重定向后的 URL
 */
const getRedirectUrl = (req) => {
  const url = new URL(req.url)
  url.pathname += "/"
  return url.href
}


/**
 * Service Worker 生命周期：安装事件
 * 
 * 功能：
 * - 预缓存静态资源（App Shell、404 页面、JS/CSS 依赖等）
 * - 立即激活新的 Service Worker，无需等待旧版本关闭
 * 
 * 生命周期流程：
 * - waitUntil(): installing ====> installed
 * - skipWaiting(): waiting(installed) ====> activating
 * 
 * @event install
 */
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => {
        console.log('[SW] Precaching static assets...')
        return cache.addAll(PRECACHE_LIST)
      })
      .then(() => {
        console.log('[SW] Static assets precached, skipping waiting...')
        return self.skipWaiting() // 立即激活，不等待旧版本关闭
      })
      .catch(err => {
        console.error('[SW] Installation failed:', err)
        throw err // 重新抛出错误，让 waitUntil 知道安装失败
      })
  )
})


/**
 * Service Worker 生命周期：激活事件
 * 
 * 功能：
 * - 删除已废弃的旧缓存，释放存储空间
 * - 立即控制所有客户端页面（无需刷新）
 * 
 * 生命周期流程：
 * - waitUntil(): activating ====> activated
 * 
 * @event activate
 */
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...')
  
  // 删除已废弃的缓存
  const deleteOldCaches = caches.keys()
    .then(cacheNames => {
      const cachesToDelete = cacheNames.filter(cacheName => 
        DEPRECATED_CACHES.includes(cacheName)
      )
      
      if (cachesToDelete.length > 0) {
        console.log('[SW] Deleting deprecated caches:', cachesToDelete)
        return Promise.all(
          cachesToDelete.map(cacheName => caches.delete(cacheName))
        )
      }
    })
    .catch(err => {
      console.error('[SW] Failed to delete old caches:', err)
    })
  
  // 立即控制所有客户端页面
  const claimClients = self.clients.claim()
    .then(() => {
      console.log('[SW] Service worker activated and controlling clients')
    })
    .catch(err => {
      console.error('[SW] Failed to claim clients:', err)
    })
  
  event.waitUntil(
    Promise.all([deleteOldCaches, claimClients])
  )
})


/**
 * 网络请求辅助工具对象
 * 提供常用的缓存策略实现
 */
const fetchHelper = {
  /**
   * 网络优先策略：先请求网络，然后缓存响应
   * 
   * 说明：
   * - 使用 CORS 模式，不包含凭证（避免跨域问题）
   * - 不透明的响应（Opaque Response）没有 headers，无法判断 ok 状态
   * - 只有成功的响应（response.ok）才会被缓存
   * 
   * @param {Request|string} request - 请求对象或 URL
   * @returns {Promise<Response>} 网络响应
   */
  fetchThenCache: function(request) {
    // 配置请求选项
    // - mode: "cors" - 允许跨域请求
    // - credentials: "omit" - 不发送凭证（避免 CORS 预检）
    const init = { 
      mode: "cors", 
      credentials: "omit" 
    }

    // 发起网络请求
    const fetched = fetch(request, init)
    
    // 克隆响应（因为 Response 只能读取一次）
    const fetchedCopy = fetched.then(resp => resp.clone())

    // 后台更新缓存（不阻塞响应）
    // 注意：不透明的响应没有 headers，response.ok 对它们没有意义
    Promise.all([fetchedCopy, caches.open(CACHE)])
      .then(([response, cache]) => {
        // 只缓存成功的响应
        if (response.ok) {
          return cache.put(request, response)
        }
      })
      .catch(err => {
        // 静默处理错误，不影响主流程
        console.warn('[SW] Failed to cache response:', err)
      })
    
    return fetched
  },

  /**
   * 缓存优先策略：先查缓存，缓存未命中时再请求网络
   * 
   * 适用场景：
   * - 静态资源（如图片、字体等）
   * - 不经常更新的内容
   * 
   * @param {Request|string} url - 请求对象或 URL
   * @returns {Promise<Response>} 缓存或网络响应
   */
  cacheFirst: function(url) {
    return caches.match(url)
      .then(resp => {
        // 如果缓存中有，直接返回
        if (resp) {
          return resp
        }
        // 否则请求网络并缓存
        return this.fetchThenCache(url)
      })
      .catch(err => {
        console.warn('[SW] Cache-first strategy failed:', err)
        // 如果都失败了，尝试直接请求网络
        return fetch(url)
      })
  }
}


/**
 * Service Worker 功能：拦截网络请求
 * 
 * 所有网络请求都会被这里拦截，我们可以：
 * - 从缓存返回响应（离线支持）
 * - 修改请求（如添加缓存破坏参数）
 * - 实现自定义缓存策略
 * 
 * 请求处理流程：
 * 1. 检查主机名白名单（跳过跨域请求如 Google Analytics）
 * 2. 处理 GitHub Pages 404 重定向问题
 * 3. 对特定资源使用缓存优先策略
 * 4. 对动态内容使用 stale-while-revalidate 策略
 * 5. 对导航请求进行内容更新检查
 * 
 * @event fetch
 * @see https://www.mnot.net/blog/2007/12/12/stale
 * @see https://gist.github.com/surma/eb441223daaedf880801ad80006389f1
 */
self.addEventListener('fetch', event => {
  const requestUrl = event.request.url
  const hostname = new URL(requestUrl).hostname

  // 调试日志（需要时可取消注释）
  // console.log(`[SW] Fetch: ${requestUrl}`)
  // console.log(`[SW] - type: ${event.request.type}; destination: ${event.request.destination}`)
  // console.log(`[SW] - mode: ${event.request.mode}, accept: ${event.request.headers.get('accept')}`)

  // 只处理白名单中的域名请求，跳过其他跨域请求（如 Google Analytics）
  if (!HOSTNAME_WHITELIST.includes(hostname)) {
    return // 不处理，使用默认网络请求
  }

  // 处理 GitHub Pages 404 重定向问题
  // 例如：repo?blah -> repo/?blah
  if (shouldRedirect(event.request)) {
    const redirectUrl = getRedirectUrl(event.request)
    console.log(`[SW] Redirecting: ${requestUrl} -> ${redirectUrl}`)
    event.respondWith(Response.redirect(redirectUrl))
    return
  }

  // 对特定静态资源使用缓存优先策略
  // 例如：ys.static 域名下的资源
  if (requestUrl.indexOf('ys.static') > -1) {
    event.respondWith(fetchHelper.cacheFirst(event.request))
    return
  }

  // 对可能动态变化的内容使用 stale-while-revalidate 策略
  // 策略说明：
  // - 立即返回缓存中的旧内容（如果存在）
  // - 同时在后台请求最新内容
  // - 用新内容更新缓存，供下次使用
  // - 如果网络请求失败，使用缓存；如果缓存也没有，返回离线页面
  
  const cached = caches.match(event.request)
  
  // 使用缓存破坏 URL 请求最新内容，并禁用浏览器缓存
  const fetched = fetch(getCacheBustingUrl(event.request), { 
    cache: "no-store" 
  })
  
  // 克隆响应用于缓存更新（Response 只能读取一次）
  const fetchedCopy = fetched.then(resp => resp.clone())
  
  // 响应策略：使用 Promise.race 返回最先完成的响应
  // - 如果网络请求成功，立即返回（即使缓存更快）
  // - 如果网络请求失败，等待缓存
  // - 如果缓存也没有，等待网络请求
  // - 如果都失败，返回离线页面
  event.respondWith(
    Promise.race([
      fetched.catch(() => cached), // 网络失败时回退到缓存
      cached // 缓存响应
    ])
      .then(resp => {
        // 如果缓存和网络都返回了，优先使用网络响应
        return resp || fetched
      })
      .catch(() => {
        // 所有策略都失败，返回离线页面
        console.warn(`[SW] All strategies failed for: ${requestUrl}, returning offline page`)
        return caches.match('./offline.html')
      })
  )

  // 后台更新缓存（不阻塞响应）
  // 只缓存状态为 ok 的响应
  event.waitUntil(
    Promise.all([fetchedCopy, caches.open(CACHE)])
      .then(([response, cache]) => {
        if (response.ok) {
          return cache.put(event.request, response)
        }
      })
      .catch(err => {
        // 静默处理错误，不影响主流程
        console.warn('[SW] Failed to update cache:', err)
      })
  )

  // 如果是 HTML 导航请求，检查内容是否有更新
  // 注意：只对同源请求进行内容验证，避免跨域问题
  if (isNavigationReq(event.request) && HOSTNAME_WHITELIST.includes(hostname)) {
    // 注意：这个日志在导航发生前执行，需要开启 "preserve logs" 才能看到
    console.log(`[SW] Navigation request: ${requestUrl}`)
    // 立即开始验证，不等待响应完成（使用 fetchedCopy 而不是等待 fetched）
    event.waitUntil(revalidateContent(cached, fetchedCopy))
  }
})


/**
 * 向所有客户端广播消息
 * 
 * 使用 MessageChannel API 向所有受控的客户端页面发送消息
 * 用于通知页面内容更新、缓存状态变化等
 * 
 * @param {Object} msg - 要发送的消息对象
 */
function sendMessageToAllClients(msg) {
  self.clients.matchAll()
    .then(clients => {
      if (clients.length === 0) {
        console.log('[SW] No clients to send message to')
        return
      }
      
      console.log(`[SW] Broadcasting message to ${clients.length} client(s):`, msg)
      clients.forEach(client => {
        client.postMessage(msg)
      })
    })
    .catch(err => {
      console.error('[SW] Failed to send message to clients:', err)
    })
}

/**
 * 异步向所有客户端广播消息
 * 
 * 说明：
 * - 使用 setTimeout 延迟发送，等待新客户端页面加载完成
 * - 这是因为在 fetch 事件期间，新打开的页面可能还没有完全初始化
 * - 减少延迟时间以加快更新检测响应速度
 * 
 * @param {Object} msg - 要发送的消息对象
 * 
 * @see https://twitter.com/Huxpro/status/799265578443751424
 * @see https://jakearchibald.com/2016/service-worker-meeting-notes/#fetch-event-clients
 */
function sendMessageToClientsAsync(msg) {
  // 减少延迟到 100ms，加快更新检测响应速度
  // 这个延迟足够让新客户端页面初始化，同时不会让用户感觉到明显的延迟
  setTimeout(() => {
    sendMessageToAllClients(msg)
  }, 100)
}

/**
 * 验证内容是否有更新
 * 
 * 功能：
 * - 使用多种方式检测内容更新：ETag > Last-Modified > Content-Length
 * - 如果内容已更新，立即通知所有客户端页面刷新
 * - 优化检测速度，减少延迟
 * 
 * 检测策略：
 * 1. 优先使用 ETag（更准确，GitHub Pages 通常提供）
 * 2. 其次使用 Last-Modified（如果 ETag 不可用）
 * 3. 最后使用 Content-Length（作为后备方案）
 * 
 * @param {Promise<Response>} cachedResp - 缓存响应的 Promise
 * @param {Promise<Response>} fetchedResp - 网络响应的 Promise
 * @returns {Promise<void>}
 */
function revalidateContent(cachedResp, fetchedResp) {
  return Promise.all([cachedResp, fetchedResp])
    .then(([cached, fetched]) => {
      // 如果缓存中没有内容，不需要验证
      if (!cached) {
        console.log('[SW] No cached content to revalidate')
        return
      }

      // 如果网络请求失败，不进行验证
      if (!fetched || !fetched.ok) {
        console.log('[SW] Network response not available for revalidation')
        return
      }

      // 策略1: 使用 ETag 检测（最准确）
      const cachedETag = cached.headers.get('etag')
      const fetchedETag = fetched.headers.get('etag')
      
      if (cachedETag && fetchedETag) {
        if (cachedETag !== fetchedETag) {
          console.log(`[SW] Content updated (ETag changed): "${cachedETag}" -> "${fetchedETag}"`)
          sendMessageToAllClients({
            command: 'UPDATE_FOUND',
            url: fetched.url
          })
          return
        } else {
          console.log('[SW] Content unchanged (ETag match)')
          return
        }
      }

      // 策略2: 使用 Last-Modified 检测
      const cachedLastModified = cached.headers.get('last-modified')
      const fetchedLastModified = fetched.headers.get('last-modified')
      
      if (cachedLastModified && fetchedLastModified) {
        if (cachedLastModified !== fetchedLastModified) {
          console.log(`[SW] Content updated (Last-Modified changed): "${cachedLastModified}" -> "${fetchedLastModified}"`)
          sendMessageToAllClients({
            command: 'UPDATE_FOUND',
            url: fetched.url
          })
          return
        } else {
          console.log('[SW] Content unchanged (Last-Modified match)')
          return
        }
      }

      // 策略3: 使用 Content-Length 作为后备（不够准确，但比没有好）
      const cachedLength = cached.headers.get('content-length')
      const fetchedLength = fetched.headers.get('content-length')
      
      if (cachedLength && fetchedLength && cachedLength !== fetchedLength) {
        console.log(`[SW] Content may be updated (Content-Length changed): "${cachedLength}" -> "${fetchedLength}"`)
        sendMessageToAllClients({
          command: 'UPDATE_FOUND',
          url: fetched.url
        })
        return
      }

      console.log('[SW] Content unchanged (no version headers available)')
    })
    .catch(err => {
      // 验证失败不影响主流程
      console.warn('[SW] Content revalidation failed:', err)
    })
}