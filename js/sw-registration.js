/* ===========================================================
 * sw-registration.js - Service Worker 注册脚本
 * ===========================================================
 * Copyright 2016 @huxpro
 * Licensed under Apache 2.0
 * 在页面中注册 Service Worker 并处理更新通知
 * ========================================================== */

/**
 * 处理 Service Worker 注册成功后的逻辑
 * 
 * 功能：
 * - 监听 Service Worker 的更新事件
 * - 在首次安装时显示离线可用提示
 * - 在更新时记录日志（由用户手动刷新页面）
 * 
 * @param {ServiceWorkerRegistration} registration - Service Worker 注册对象
 * 
 * @see https://youtu.be/Gb9uI67tqV0
 */
function handleRegistration(registration) {
  console.log('[SW Registration] Service Worker registered:', registration)
  
  /**
   * 监听 Service Worker 更新事件
   * 当有新的 Service Worker 开始安装时触发
   */
  registration.onupdatefound = () => {
    const installingWorker = registration.installing
    
    if (!installingWorker) {
      return
    }
    
    /**
     * 监听安装 Worker 的状态变化
     */
    installingWorker.onstatechange = () => {
      // 只处理已安装状态
      if (installingWorker.state !== 'installed') {
        return
      }
      
      // 如果已经有活跃的 Service Worker，说明这是更新
      if (navigator.serviceWorker.controller) {
        console.log('[SW Registration] Service Worker updated (refresh to activate)')
        // 注意：这里不自动刷新，让用户决定何时刷新
        // Service Worker 会在下次访问时自动激活
      } else {
        // 首次安装，没有之前的 Service Worker
        console.log('[SW Registration] Service Worker installed for the first time')
        
        // 显示离线可用提示
        if (typeof createSnackbar === 'function') {
          createSnackbar({
            message: 'App ready for offline use.',
            duration: 3000
          })
        }
      }
    }
  }
}

/**
 * 注册 Service Worker
 * 
 * 说明：
 * - Service Worker 只能控制与其同目录或子目录下的页面
 * - 因此 sw.js 必须放在网站根目录
 * - 只在支持 Service Worker 的浏览器中注册
 */
if (navigator.serviceWorker) {
  // 注册 Service Worker
  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      handleRegistration(registration)
    })
    .catch((error) => {
      console.error('[SW Registration] Service Worker registration failed:', error)
    })

  /**
   * 注册消息接收器
   * 接收来自 Service Worker 的消息（如内容更新通知）
   * 
   * @see https://dbwriteups.wordpress.com/2015/11/16/service-workers-part-3-communication-between-sw-and-pages/
   */
  navigator.serviceWorker.onmessage = (event) => {
    console.log('[SW Registration] Message from Service Worker:', event)
    const data = event.data
    
    // 处理内容更新通知
    if (data.command === 'UPDATE_FOUND') {
      console.log('[SW Registration] Content update found:', data)
      
      // 显示更新提示，提供刷新按钮
      if (typeof createSnackbar === 'function') {
        createSnackbar({
          message: 'Content updated.',
          actionText: 'refresh',
          action: () => {
            // 刷新页面以加载新内容
            location.reload()
          }
        })
      } else {
        // 如果 createSnackbar 不可用，使用简单的确认对话框
        if (confirm('Content has been updated. Reload page?')) {
          location.reload()
        }
      }
    }
  }
} else {
  console.warn('[SW Registration] Service Worker is not supported in this browser')
}
