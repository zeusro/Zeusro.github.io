#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新已有翻译的文章为多语言模式
"""
import re
from pathlib import Path

def get_filename_base(post_file):
    """从post文件名获取基础文件名"""
    # 例如: 2020-09-09-cloud-native-engineer-go-to-heaven.md
    # 返回: cloud-native-engineer-go-to-heaven
    match = re.match(r'\d{4}-\d{2}-\d{2}-(.+)\.md', post_file.name)
    if match:
        return match.group(1)
    return post_file.stem

def has_translations(folder_name, filename_base):
    """检查是否已有翻译文件"""
    include_dir = Path('_includes/posts') / folder_name
    if not include_dir.exists():
        return False
    
    # 检查至少有一个非中文的翻译文件存在且不是TODO占位符
    for lang in ['en', 'jp', 'ru']:
        lang_file = include_dir / f"{filename_base}_{lang}.md"
        if lang_file.exists():
            content = lang_file.read_text(encoding='utf-8')
            # 检查不是TODO占位符
            if f'TODO: Translate to {lang}' not in content and content.strip() != '':
                return True
    return False

def update_post_to_multilingual(post_file):
    """更新文章为多语言模式"""
    print(f"Processing: {post_file.name}")
    
    # 读取原始文件
    original_content = post_file.read_text(encoding='utf-8')
    
    # 检查是否已有多语言支持
    if 'multilingual: true' in original_content:
        print(f"  Already has multilingual support, skipping...")
        return False
    
    # 获取文件夹名和文件名
    folder_name = post_file.stem
    filename_base = get_filename_base(post_file)
    
    # 检查是否已有翻译
    if not has_translations(folder_name, filename_base):
        print(f"  No translations found, skipping...")
        return False
    
    # 检查是否有中文版本
    include_dir = Path('_includes/posts') / folder_name
    zh_file = include_dir / f"{filename_base}_zh.md"
    if not zh_file.exists():
        print(f"  No Chinese version found, skipping...")
        return False
    
    # 更新front matter，添加 multilingual: true
    # 找到front matter的结束位置
    if not original_content.startswith('---'):
        print(f"  Invalid front matter format, skipping...")
        return False
    
    front_matter_end = original_content.find('---', 3)
    if front_matter_end == -1:
        print(f"  Invalid front matter format, skipping...")
        return False
    
    front_matter = original_content[:front_matter_end + 3]
    body_content = original_content[front_matter_end + 3:].strip()
    
    # 添加 multilingual: true 到 front matter
    if 'multilingual:' not in front_matter:
        # 在 catalog 或 published 之后添加
        if 'catalog:' in front_matter:
            front_matter = front_matter.replace('catalog:', 'multilingual: true\ncatalog:')
        elif 'published:' in front_matter:
            front_matter = front_matter.replace('published:', 'multilingual: true\npublished:')
        else:
            # 在 tags 之前添加
            if 'tags:' in front_matter:
                front_matter = front_matter.replace('tags:', 'multilingual: true\ntags:')
            else:
                # 在最后一个---之前添加
                front_matter = front_matter[:-3] + 'multilingual: true\n---'
    else:
        # 替换现有的 multilingual: false
        front_matter = re.sub(r'multilingual:\s*false', 'multilingual: true', front_matter, flags=re.IGNORECASE)
        front_matter = re.sub(r'multilingual:\s*true', 'multilingual: true', front_matter, flags=re.IGNORECASE)
    
    # 构建多语言include部分
    multilingual_section = f"""

<!-- Chinese Version -->
<div class="zh post-container">
    {{% capture about_zh %}}{{% include posts/{folder_name}/{filename_base}_zh.md %}}{{% endcapture %}}
    {{{{ about_zh | markdownify }}}}
</div>

<!-- English Version -->
<div class="en post-container">
    {{% capture about_en %}}{{% include posts/{folder_name}/{filename_base}_en.md %}}{{% endcapture %}}
    {{{{ about_en | markdownify }}}}
</div>

<!-- Japanese Version -->
<div class="jp post-container">
    {{% capture about_jp %}}{{% include posts/{folder_name}/{filename_base}_jp.md %}}{{% endcapture %}}
    {{{{ about_jp | markdownify }}}}
</div>

<!-- Russian Version -->
<div class="ru post-container">
    {{% capture about_ru %}}{{% include posts/{folder_name}/{filename_base}_ru.md %}}{{% endcapture %}}
    {{{{ about_ru | markdownify }}}}
</div>
"""
    
    # 组合新内容
    updated_content = front_matter + multilingual_section
    
    # 写回文件
    post_file.write_text(updated_content, encoding='utf-8')
    print(f"  Updated: {post_file.name}")
    return True

def main():
    posts_dir = Path('_posts')
    includes_dir = Path('_includes/posts')
    
    # 获取所有已有的多语言文件夹
    existing_multilingual = set()
    if includes_dir.exists():
        for item in includes_dir.iterdir():
            if item.is_dir() and not item.name.startswith('.'):
                existing_multilingual.add(item.name)
    
    # 获取所有需要处理的文件
    posts_to_update = []
    for file in sorted(posts_dir.glob('*.md')):
        # 跳过特定文件
        if file.name == '2020-08-07-fuck-microsoft.md':
            continue
        
        # 读取文件检查 published 状态
        content = file.read_text(encoding='utf-8')
        if re.search(r'published:\s*false', content, re.IGNORECASE):
            continue
        
        folder_name = file.stem
        
        # 检查是否已有多语言版本文件夹
        if folder_name in existing_multilingual:
            # 检查是否还没有 multilingual: true
            if 'multilingual: true' not in content:
                posts_to_update.append(file)
    
    print(f"Found {len(posts_to_update)} posts to update")
    print()
    
    updated_count = 0
    # 处理每个文件
    for post_file in posts_to_update:
        try:
            if update_post_to_multilingual(post_file):
                updated_count += 1
        except Exception as e:
            print(f"Error processing {post_file.name}: {e}")
            import traceback
            traceback.print_exc()
    
    print()
    print(f"Updated {updated_count} posts")

if __name__ == '__main__':
    main()
