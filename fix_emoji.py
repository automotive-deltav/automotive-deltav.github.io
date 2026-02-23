#!/usr/bin/env python3
import os
import glob

admin_path = r"c:\Users\Andrei\Downloads\DeltaV\admin_local"
old_footer = '''    <input type="text" id="quickNavSearch" placeholder="''' + chr(0xf0) + chr(0xb8) + '''" Go to page..." style="padding:8px;border:1px solid #e2e8f0;border-radius:6px;font-size:.85rem" onkeypress="if(event.key==='Enter') quickNav()">
    <button class="btn btn-ghost btn-sm" onclick="showPageGuide()" style="border:1px solid #e2e8f0" title="''' + chr(0xf0) + chr(0xb8) + '''"š View all pages">''' + chr(0xf0) + chr(0xb8) + '''"š Guide</button>
    <button class="btn btn-ghost btn-sm" onclick="toggleDarkMode()" style="border:1px solid #e2e8f0">''' + chr(0xf0) + chr(0xb8) + '''Œ™ Theme</button>
    <button class="btn btn-danger btn-sm" onclick="if(confirm('Log out?')){sessionStorage.removeItem('dv_admin');location.href='login.html';}" >''' + chr(0xf0) + chr(0xb8) + '''§ª Log Out</button>'''

new_footer = '''    <input type="text" id="quickNavSearch" placeholder="🔍 Go to page..." style="padding:8px;border:1px solid #e2e8f0;border-radius:6px;font-size:.85rem" onkeypress="if(event.key==='Enter') quickNav()">
    <button class="btn btn-ghost btn-sm" onclick="showPageGuide()" style="border:1px solid #e2e8f0" title="📚 View all pages">📚 Guide</button>
    <button class="btn btn-ghost btn-sm" onclick="toggleDarkMode()" style="border:1px solid #e2e8f0">🌙 Theme</button>
    <button class="btn btn-danger btn-sm" onclick="if(confirm('Log out?')){sessionStorage.removeItem('dv_admin');location.href='login.html';}">🚪 Log Out</button>'''

files = glob.glob(os.path.join(admin_path, "*.html"))
count = 0
for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Try to fix using UTF-8 encoding properly
        original_len = len(content)
        
        # Save with proper UTF-8 encoding
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✓ {os.path.basename(filepath)}")
        count += 1
    except Exception as e:
        print(f"✗ {os.path.basename(filepath)}: {e}")

print(f"\n[Done] Processed {count} files")
