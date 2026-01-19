# 修改历史

## 添加基于浏览器语言的自动语言切换功能

2026-01-10

实现了根据浏览器请求头（Accept-Language）自动切换到对应语言的功能。如果浏览器语言不匹配支持的语言，则根据地区判断：华文地区使用中文，其余地区使用英文。

### 实现内容

**更新时间**: 2026-01-10

1. **自动语言检测功能** (`_includes/footer.html` 的 `detectLanguageFromBrowser` 函数)：
   - 读取浏览器的语言偏好列表（`navigator.languages` 或 `navigator.language`）
   - 支持的语言映射：
     - 中文：`zh-CN`, `zh-TW`, `zh-HK`, `zh-MO`, `zh-SG` 等 → `zh`
     - 英文：`en-US`, `en-GB` 等 → `en`
     - 日语：`ja-JP`, `ja` → `jp`
     - 俄语：`ru-RU`, `ru` → `ru`
   - 首先尝试精确匹配，然后匹配语言代码前缀

2. **地区回退逻辑**：
   - 如果浏览器语言不匹配支持的语言，根据地区判断：
     - **华文地区**（通过时区检测）：中国大陆、台湾、香港、澳门、新加坡 → 使用中文
     - **其他地区** → 使用英文
   - 时区检测（优先）：使用 `Intl.DateTimeFormat().resolvedOptions().timeZone` 判断
     - 支持的华文地区时区：`Asia/Shanghai`, `Asia/Taipei`, `Asia/Hong_Kong`, `Asia/Macau`, `Asia/Singapore`
   - 语言前缀检测（备用）：如果时区检测失败，通过浏览器语言前缀判断

3. **语言选择优先级**：
   - **第一优先级**：URL 参数（`?lang=xx`）- 用户手动选择或已保存的选择
   - **第二优先级**：Hash 中的语言代码（`#zh`, `#en` 等）- 自动转换为 URL 参数
   - **第三优先级**：浏览器语言自动检测 - 首次访问时使用

4. **URL 管理优化** (`_includes/footer.html` 的 `initLanguage` 函数)：
   - 自动检测后会将语言写入 URL 参数（如 `?lang=zh`），确保刷新页面时保持语言选择
   - 将 hash 中的语言代码自动转换为 URL 参数，保持一致性
   - 保留页面锚点（如 `#section1`），不影响页面内跳转

**代码位置**: 
- `_includes/footer.html` 第317-377行（`detectLanguageFromBrowser` 函数）
- `_includes/footer.html` 第484-530行（`initLanguage` 函数）
- `_includes/footer.html` 第379-447行（`_render` 函数优化）

### 实现效果

1. ✅ **自动语言检测**：首次访问时根据浏览器语言和地区自动选择最合适的语言
2. ✅ **智能地区判断**：通过时区准确识别华文地区，提供更好的用户体验
3. ✅ **保持用户选择**：用户手动选择的语言会被保存到 URL 参数中，刷新页面时保持
4. ✅ **向后兼容**：完全兼容现有的 URL 参数和 hash 语言选择方式
5. ✅ **不影响锚点**：自动语言检测不会影响页面内的锚点跳转功能

### 技术细节

#### 语言检测流程

1. **读取浏览器语言**：
   ```javascript
   var browserLangs = navigator.languages || [navigator.language || navigator.userLanguage];
   ```

2. **精确匹配**：
   - 首先尝试完整匹配（如 `zh-CN`, `en-US`）
   - 然后尝试语言代码前缀匹配（如 `zh-CN` → `zh`）

3. **地区回退**：
   - 如果语言不匹配，通过时区判断地区
   - 华文地区时区列表：`Asia/Shanghai`, `Asia/Taipei`, `Asia/Hong_Kong`, `Asia/Macau`, `Asia/Singapore`
   - 如果时区检测失败，使用浏览器语言前缀作为备用判断

#### URL 参数管理

- 自动检测后更新 URL：`/path/to/page?lang=zh`
- Hash 转换：`#zh` → `?lang=zh`
- 保留锚点：`?lang=zh#section1` 中的 `#section1` 会被保留

#### 优先级逻辑

```
1. URL 参数 (?lang=xx) → 直接使用
2. Hash 语言代码 (#zh, #en 等) → 转换为 URL 参数后使用
3. 浏览器语言检测 → 检测后写入 URL 参数
```

### 使用场景

1. **首次访问**：用户首次访问多语言文章时，系统自动根据浏览器语言和地区选择语言
2. **刷新页面**：刷新页面时，URL 参数中的语言选择会被保留
3. **手动切换**：用户通过下拉菜单手动切换语言时，选择会被保存到 URL 参数中
4. **分享链接**：分享带有语言参数的链接时，接收者会看到对应语言版本

### 修改的文件列表

1. `_includes/footer.html` - 添加 `detectLanguageFromBrowser` 和 `initLanguage` 函数，优化 `_render` 函数

---

## 修复 Service Worker 内容更新检测缓慢和多语言冲突问题

2026-01-10

修复了 Service Worker 中内容更新检测缓慢的问题，以及 Service Worker 与多语言功能冲突的问题。主要解决了更新检测延迟过长和不同语言版本内容被错误缓存的问题。

### 修复内容

**更新时间**: 2026-01-10

1. **优化内容更新检测机制** (`sw.js` 的 `revalidateContent` 函数)：
   - 改进检测策略：优先使用 ETag（最准确），其次使用 Last-Modified，最后使用 Content-Length 作为后备
   - 移除不必要的延迟：将 `sendMessageToClientsAsync` 的延迟从 1 秒减少到 100ms，加快更新检测响应速度
   - 直接使用 `sendMessageToAllClients` 而不是异步版本，进一步减少延迟
   - 添加更详细的日志输出，便于调试

2. **修复多语言参数冲突** (`sw.js` 的 `getCacheBustingUrl` 函数)：
   - 使用 `URLSearchParams` API 正确处理查询参数，确保在添加 `cache-bust` 参数时保留 `lang` 参数
   - 确保不同语言版本（`?lang=zh`、`?lang=en` 等）被正确缓存和区分
   - 避免多语言切换时出现内容混淆的问题

3. **优化导航请求验证** (`sw.js` 的 `fetch` 事件处理器)：
   - 添加主机名白名单检查，只对同源请求进行内容验证，避免跨域问题
   - 确保验证逻辑只在合适的请求上执行

**代码位置**: 
- `sw.js` 第79-91行（`getCacheBustingUrl` 函数）
- `sw.js` 第479-484行（`sendMessageToClientsAsync` 函数）
- `sw.js` 第504-570行（`revalidateContent` 函数）
- `sw.js` 第432-437行（导航请求验证）

### 修复效果

1. ✅ **内容更新检测更快**：从 1 秒延迟减少到几乎实时检测，用户体验更好
2. ✅ **多语言版本正确缓存**：不同语言版本的内容被正确区分和缓存，不会出现内容混淆
3. ✅ **更准确的更新检测**：使用 ETag 优先策略，检测更准确可靠
4. ✅ **更好的错误处理**：添加了更完善的错误处理和日志输出

### 技术细节

#### 内容更新检测策略
1. **ETag 检测**（优先）：GitHub Pages 通常提供 ETag 头，这是最准确的检测方式
2. **Last-Modified 检测**（次要）：如果 ETag 不可用，使用 Last-Modified 头
3. **Content-Length 检测**（后备）：作为最后的检测手段，虽然不够准确但比没有好

#### 多语言参数处理
- 使用 `URLSearchParams` API 确保查询参数的正确处理
- 保留 `lang` 参数，确保 `?lang=zh`、`?lang=en` 等不同语言版本被正确区分
- 添加 `cache-bust` 参数时不影响现有的语言参数

#### 性能优化
- 将更新通知延迟从 1000ms 减少到 100ms
- 直接使用同步消息发送，进一步减少延迟
- 优化验证逻辑，避免不必要的检查

### 修改的文件列表

1. `sw.js` - 修复内容更新检测和多语言参数处理

---

## 修复锚点点击失效问题

2026-01-10

修复了页面锚点点击一次就失效的问题。主要原因是 `jquery.nav.js` 的 `handleClick` 方法中，当点击当前已激活的锚点时，滚动逻辑不会执行，但 `e.preventDefault()` 仍然会被调用，导致锚点点击失效。

### 修复内容

**更新时间**: 2026-01-10

1. **修复 `jquery.nav.js` 的 `handleClick` 方法**：
   - 移除了阻止当前已激活锚点滚动的条件判断
   - 确保即使点击的是当前已激活的锚点，也能正常滚动
   - 确保 `bindInterval()` 总是被调用，防止事件监听器丢失

2. **优化 `_includes/footer.html` 中的目录初始化**：
   - 在多语言切换时，重新生成目录后会自动重新初始化 `onePageNav`
   - 确保新生成的锚点链接能够正常工作

**代码位置**: 
- `js/jquery.nav.js` 第142-178行
- `_includes/footer.html` 第280-310行、第357行

### 修复效果

1. ✅ **锚点点击始终有效**：无论点击的是否是当前已激活的锚点，都能正常滚动
2. ✅ **事件监听器不会丢失**：确保 `bindInterval()` 总是被调用，防止事件监听器丢失
3. ✅ **多语言切换后锚点正常**：在多语言切换时，重新生成的目录锚点能够正常工作

### 技术细节

修复的核心逻辑：
- 将 `isCurrentSection` 的判断提前，但不再阻止滚动执行
- 即使点击的是当前已激活的锚点，也会执行滚动动画
- 在滚动动画的回调中，确保 `bindInterval()` 总是被调用

### 修改的文件列表

1. `js/jquery.nav.js` - 修复 `handleClick` 方法，确保锚点点击始终有效
2. `_includes/footer.html` - 优化目录初始化逻辑，支持多语言切换后重新初始化

---

## SEO优化

2026-01-10 04:48:14

针对多语言切换功能进行了SEO优化，使其对Google搜索引擎更加友好。主要解决了之前所有语言版本都在同一个URL上，通过JavaScript切换显示的问题，这种实现方式对搜索引擎不友好。

---

### 添加 hreflang 标签

**更新时间**: 2026-01-10 04:48:14

为多语言文章添加了 `hreflang` 标签，告诉Google不同语言版本的对应关系：

- 支持的语言版本：
  - `zh` - 中文
  - `en` - 英文
  - `ja` - 日文（URL参数使用 `jp`，但hreflang使用标准ISO代码 `ja`）
  - `ru` - 俄文
- 添加了 `x-default` 标签指向默认语言版本（中文）
- 所有hreflang标签使用绝对URL，包含协议前缀

**代码位置**: `_includes/head.html` 第42-54行

---

### 优化 Canonical 标签

**更新时间**: 2026-01-10 04:48:14

- 多语言文章的canonical标签现在包含语言参数（`?lang=xx`）
- 确保每个语言版本都有明确的canonical URL，避免重复内容问题
- 自动处理URL协议前缀（如果配置中没有包含 `://`，会自动添加 `https://`）

**代码位置**: `_includes/head.html` 第41-57行

---

### 改进语言切换JavaScript逻辑

**更新时间**: 2026-01-10 04:48:14

优化了语言切换功能，使其更符合SEO最佳实践：

- **优先从URL参数读取语言**：JavaScript现在优先从URL查询参数（`?lang=xx`）读取语言，而不是仅从hash读取
- **URL参数更新**：语言切换时使用 `history.replaceState` 更新URL参数，不刷新页面
- **动态更新HTML lang属性**：切换语言时自动更新 `<html lang="xx">` 属性
- **向后兼容**：仍然支持从hash读取语言，保持向后兼容

**代码位置**: `_includes/footer.html` 第312-336行

---

### 添加HTML lang属性

**更新时间**: 2026-01-10 04:48:14

- 为多语言页面设置正确的 `lang` 属性
- 默认语言设置为中文（`zh`）
- 日文使用标准ISO代码 `ja`（虽然内部使用 `jp`）

**代码位置**: `_layouts/default.html` 第2-8行

---

### SEO改进效果

1. ✅ **Google能识别不同语言版本**：通过hreflang标签，Google可以正确理解不同语言版本的对应关系
2. ✅ **避免重复内容问题**：每个语言版本都有明确的canonical URL
3. ✅ **更好的语言定位**：HTML lang属性帮助搜索引擎理解页面语言
4. ✅ **可索引的URL**：使用URL参数（`?lang=xx`）而不是仅使用hash，搜索引擎可以更好地抓取和索引

### 技术细节

#### URL格式
- 多语言文章URL格式：`/2025/09/23/iron/?lang=zh`
- 语言参数：`?lang=zh` | `?lang=en` | `?lang=jp` | `?lang=ru`

#### hreflang标签格式
```html
<link rel="alternate" hreflang="zh" href="https://Zeusro.github.io/2025/09/23/iron/?lang=zh">
<link rel="alternate" hreflang="en" href="https://Zeusro.github.io/2025/09/23/iron/?lang=en">
<link rel="alternate" hreflang="ja" href="https://Zeusro.github.io/2025/09/23/iron/?lang=jp">
<link rel="alternate" hreflang="ru" href="https://Zeusro.github.io/2025/09/23/iron/?lang=ru">
<link rel="alternate" hreflang="x-default" href="https://Zeusro.github.io/2025/09/23/iron/?lang=zh">
```

### 建议的后续优化

为了确保hreflang标签使用正确的绝对URL，建议在 `_config.yml` 中将 `url` 更新为包含协议的完整URL：

```yaml
url: "https://Zeusro.github.io"  # 添加 https:// 前缀
```

或者如果使用自定义域名：
```yaml
url: "https://yourdomain.com"
```

### 修改的文件列表

1. `_includes/head.html` - 添加hreflang标签和优化canonical标签
2. `_includes/footer.html` - 优化语言切换JavaScript逻辑
3. `_layouts/default.html` - 添加动态HTML lang属性

### 测试建议

1. 检查多语言文章的HTML源码，确认hreflang标签正确生成
2. 使用Google Search Console验证hreflang标签
3. 测试语言切换功能，确认URL参数正确更新
4. 验证不同语言版本的页面都能被正确索引

---

## 补齐多语言文章缺少的语言版本

2026-01-20

补齐了 `_posts/` 目录中缺少语言版本的多语言文章，确保所有多语言文章都包含完整的四国语言版本（中文、英文、日语、俄语）。

### 更新内容

**更新时间**: 2026-01-20

本次更新主要是在主文章文件中添加了对应的语言版本 div 引用。所有文章的翻译内容文件（`_includes/posts/` 目录下的文件）已经存在，只需要在主文件中添加引用即可。

### 更新的文章列表

#### 1. 2025-10-21-i-love-haohao.md
- **缺少的语言**: 日语 (jp)、俄语 (ru)
- **状态**: ✅ 已补齐
- **说明**: 在主文件中添加了日语和俄语版本的 div 引用

#### 2. 2025-10-20-best-cloud-naive.md
- **缺少的语言**: 日语 (jp)、俄语 (ru)
- **状态**: ✅ 已补齐
- **说明**: 在主文件中添加了日语和俄语版本的 div 引用

#### 3. 2025-08-26-bullshit-go.md
- **缺少的语言**: 日语 (jp)、俄语 (ru)
- **状态**: ✅ 已补齐
- **说明**: 在主文件中添加了日语和俄语版本的 div 引用

#### 4. 2025-06-17-TSP.md
- **缺少的语言**: 日语 (jp)、俄语 (ru)
- **状态**: ✅ 已补齐
- **说明**: 在主文件中添加了日语和俄语版本的 div 引用

#### 5. 2025-06-29-ab.md
- **缺少的语言**: 日语 (jp)、俄语 (ru)
- **状态**: ✅ 已补齐
- **说明**: 在主文件中添加了日语和俄语版本的 div 引用

#### 6. 2025-07-12-DuckDuckGo.md
- **缺少的语言**: 日语 (jp)、俄语 (ru)
- **状态**: ✅ 已补齐
- **说明**: 在主文件中添加了日语和俄语版本的 div 引用

#### 7. 2025-08-30-another-universe.md
- **缺少的语言**: 日语 (jp)、俄语 (ru)
- **状态**: ✅ 已补齐
- **说明**: 在主文件中添加了日语和俄语版本的 div 引用

#### 8. 2025-09-12-prove-principle-of-superposition.md
- **缺少的语言**: 日语 (jp)、俄语 (ru)
- **状态**: ✅ 已补齐
- **说明**: 在主文件中添加了日语和俄语版本的 div 引用

#### 9. 2018-11-20-learn-kubernetes.md
- **缺少的语言**: 俄语 (ru)
- **状态**: ✅ 已补齐
- **说明**: 在主文件中添加了俄语版本的 div 引用

#### 10. 2025-11-17-quantum-sport.md
- **缺少的语言**: 俄语 (ru)
- **状态**: ✅ 已补齐
- **说明**: 在主文件中添加了俄语版本的 div 引用

#### 11. 2025-11-27-go-java-c.md
- **缺少的语言**: 俄语 (ru)
- **状态**: ✅ 已补齐
- **说明**: 在主文件中添加了俄语版本的 div 引用

### 技术说明

所有文章的翻译内容文件（`_includes/posts/` 目录下的文件）已经存在，本次更新主要是在主文章文件中添加了对应的语言版本 div 引用，格式如下：

```html
<!-- Japanese Version -->
<div class="jp post-container">
    {% capture about_jp %}{% include posts/{folder}/{filename}_jp.md %}{% endcapture %}
    {{ about_jp | markdownify }}
</div>

<!-- Russian Version -->
<div class="ru post-container">
    {% capture about_ru %}{% include posts/{folder}/{filename}_ru.md %}{% endcapture %}
    {{ about_ru | markdownify }}
</div>
```

### 验证结果

- ✅ 所有多语言文章现在都包含完整的四国语言版本
- ✅ 使用 `check_multilingual.py` 脚本验证，未发现缺少翻译的文章
- ✅ 所有语言版本的 include 文件均存在且完整

### 统计信息

- **更新的文章数量**: 11 篇
- **添加的语言版本**: 日语版本 8 个，俄语版本 11 个
- **状态**: 全部完成 ✅

### 修改的文件列表

1. `_posts/2025-10-21-i-love-haohao.md` - 添加日语和俄语版本
2. `_posts/2025-10-20-best-cloud-naive.md` - 添加日语和俄语版本
3. `_posts/2025-08-26-bullshit-go.md` - 添加日语和俄语版本
4. `_posts/2025-06-17-TSP.md` - 添加日语和俄语版本
5. `_posts/2025-06-29-ab.md` - 添加日语和俄语版本
6. `_posts/2025-07-12-DuckDuckGo.md` - 添加日语和俄语版本
7. `_posts/2025-08-30-another-universe.md` - 添加日语和俄语版本
8. `_posts/2025-09-12-prove-principle-of-superposition.md` - 添加日语和俄语版本
9. `_posts/2018-11-20-learn-kubernetes.md` - 添加俄语版本
10. `_posts/2025-11-17-quantum-sport.md` - 添加俄语版本
11. `_posts/2025-11-27-go-java-c.md` - 添加俄语版本
