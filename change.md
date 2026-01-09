# 多语言SEO优化改进记录

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
