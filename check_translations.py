#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查需要翻译的文章
"""
import re
from pathlib import Path

def check_translations():
    """检查所有需要翻译的文章"""
    includes_dir = Path('_includes/posts')
    
    posts_to_translate = []
    
    # 遍历所有文章文件夹
    for post_dir in sorted(includes_dir.iterdir()):
        if not post_dir.is_dir() or post_dir.name.startswith('.'):
            continue
        
        # 查找所有语言文件
        lang_files = {}
        for lang in ['zh', 'en', 'jp', 'ru']:
            # 查找该语言的文件
            lang_pattern = f"*_{lang}.md"
            lang_file_list = list(post_dir.glob(lang_pattern))
            
            if lang_file_list:
                lang_file = lang_file_list[0]
                content = lang_file.read_text(encoding='utf-8')
                
                # 检查是否是TODO占位符
                is_todo = f'TODO: Translate to {lang}' in content or content.strip() == ''
                lang_files[lang] = {
                    'file': lang_file,
                    'is_todo': is_todo,
                    'content': content
                }
            else:
                lang_files[lang] = None
        
        # 检查哪些语言需要翻译
        missing_langs = []
        for lang in ['en', 'jp', 'ru']:
            if lang_files[lang] is None:
                missing_langs.append(lang)
            elif lang_files[lang]['is_todo']:
                missing_langs.append(lang)
        
        if missing_langs:
            # 获取中文版本作为参考
            zh_content = lang_files.get('zh', {}).get('content', '') if lang_files.get('zh') else ''
            posts_to_translate.append({
                'post_dir': post_dir,
                'missing_langs': missing_langs,
                'zh_content': zh_content,
                'lang_files': lang_files
            })
    
    return posts_to_translate

if __name__ == '__main__':
    posts_to_translate = check_translations()
    print(f"Found {len(posts_to_translate)} posts that need translation:")
    print()
    for item in posts_to_translate:
        print(f"{item['post_dir'].name}:")
        print(f"  Missing translations: {', '.join(item['missing_langs'])}")
        print()
