#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量处理多语言文件
"""
import os
import re
from pathlib import Path

def extract_content(file_path):
    """提取文件内容（去掉front matter）"""
    content = file_path.read_text(encoding='utf-8')
    
    # 找到front matter的结束位置
    if content.startswith('---'):
        # 找到第二个---
        end_pos = content.find('---', 3)
        if end_pos != -1:
            content = content[end_pos + 3:].strip()
    
    return content

def get_filename_base(post_file):
    """从post文件名获取基础文件名"""
    # 例如: 2020-09-09-cloud-native-engineer-go-to-heaven.md
    # 返回: cloud-native-engineer-go-to-heaven
    match = re.match(r'\d{4}-\d{2}-\d{2}-(.+)\.md', post_file.name)
    if match:
        return match.group(1)
    return post_file.stem

def process_file(post_file):
    """处理单个文件"""
    print(f"Processing: {post_file.name}")
    
    # 读取原始文件
    original_content = post_file.read_text(encoding='utf-8')
    
    # 检查是否已有多语言支持
    if 'multilingual: true' in original_content:
        print(f"  Already has multilingual support, skipping...")
        return
    
    # 提取内容
    content = extract_content(post_file)
    
    # 获取文件夹名和文件名
    folder_name = post_file.stem
    filename_base = get_filename_base(post_file)
    
    # 创建目录
    include_dir = Path('_includes/posts') / folder_name
    include_dir.mkdir(parents=True, exist_ok=True)
    
    # 创建中文版本
    zh_file = include_dir / f"{filename_base}_zh.md"
    zh_file.write_text(content, encoding='utf-8')
    print(f"  Created: {zh_file}")
    
    # 创建占位符文件（需要手动翻译）
    for lang in ['en', 'jp', 'ru']:
        lang_file = include_dir / f"{filename_base}_{lang}.md"
        lang_file.write_text(f"<!-- TODO: Translate to {lang} -->\n\n{content}", encoding='utf-8')
        print(f"  Created placeholder: {lang_file}")
    
    # 更新原始文件
    # 替换 multilingual: false 为 multilingual: true
    updated_content = original_content.replace('multilingual: false', 'multilingual: true')
    
    # 添加多语言include部分（在front matter之后）
    if 'multilingual: true' in updated_content:
        # 找到front matter结束位置
        front_matter_end = updated_content.find('---', 3) + 3
        if front_matter_end > 2:
            # 插入多语言部分
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
            # 如果已经有内容，替换；否则追加
            if len(updated_content[front_matter_end:].strip()) > 0:
                # 有内容，需要替换
                updated_content = updated_content[:front_matter_end] + multilingual_section
            else:
                # 没有内容，直接追加
                updated_content = updated_content[:front_matter_end] + multilingual_section
    
    # 写回文件
    post_file.write_text(updated_content, encoding='utf-8')
    print(f"  Updated: {post_file.name}")

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
    posts_files = []
    for file in posts_dir.glob('*.md'):
        if file.name == '2025-08-22-zero.md':
            continue
        
        # 读取文件检查 published 状态
        content = file.read_text(encoding='utf-8')
        if re.search(r'published:\s*false', content):
            continue
        
        folder_name = file.stem
        
        # 检查是否已有多语言版本
        if folder_name not in existing_multilingual:
            posts_files.append(file)
    
    print(f"Found {len(posts_files)} files to process")
    
    # 处理每个文件
    for post_file in sorted(posts_files):
        try:
            process_file(post_file)
        except Exception as e:
            print(f"Error processing {post_file.name}: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    main()
