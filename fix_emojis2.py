import os, glob

# Mojibake byte patterns -> correct UTF-8 bytes
# These are the raw bytes that appear when UTF-8 emojis are double-encoded
byte_replacements = [
    # Emoji replacements (mojibake bytes -> correct emoji bytes)
    (b'\xc3\xb0\xc2\x9f\xc2\x94\xc2\x84', '🔄'.encode('utf-8')),  # 🔄
    (b'\xc3\xb0\xc2\x9f\xc2\x93\xc2\xa5', '📥'.encode('utf-8')),  # 📥
    (b'\xc3\xb0\xc2\x9f\xc2\x97\xc2\x91\xc3\xaf\xc2\xb8\xc2\x8f', '🗑️'.encode('utf-8')),  # 🗑️
    (b'\xc3\xb0\xc2\x9f\xc2\x93\xc2\x9e', '📞'.encode('utf-8')),  # 📞
    (b'\xc3\xb0\xc2\x9f\xc2\x91\xc2\xa4', '👤'.encode('utf-8')),  # 👤
    (b'\xc3\xb0\xc2\x9f\xc2\x94\xc2\xa7', '🔧'.encode('utf-8')),  # 🔧
    (b'\xc3\xb0\xc2\x9f\xc2\x93\xc2\x8c', '📌'.encode('utf-8')),  # 📌
    (b'\xc3\xb0\xc2\x9f\xc2\x9a\xc2\xaa', '🚪'.encode('utf-8')),  # 🚪
    (b'\xc3\xb0\xc2\x9f\xc2\x8c\xc2\x90', '🌐'.encode('utf-8')),  # 🌐
    # Special character replacements
    (b'\xc3\xa2\xc2\x80\xc2\x94', '\u2014'.encode('utf-8')),  # — em dash
    (b'\xc3\xa2\xc2\x80\xc2\xa2', '\u2022'.encode('utf-8')),  # • bullet
    (b'\xc3\xa2\xc2\x9c\xc2\x93', '\u2713'.encode('utf-8')),  # ✓ checkmark
    (b'\xc3\xa2\xc2\x96\xc2\xbc', '\u25bc'.encode('utf-8')),  # ▼ triangle
]

folder = r'c:\Users\Andrei\Downloads\DeltaV\admin_local'
files = glob.glob(os.path.join(folder, '*.html'))

total_changes = 0
for fpath in files:
    with open(fpath, 'rb') as f:
        content = f.read()
    
    original = content
    changes = 0
    for old_bytes, new_bytes in byte_replacements:
        count = content.count(old_bytes)
        if count > 0:
            content = content.replace(old_bytes, new_bytes)
            changes += count
    
    if changes > 0:
        with open(fpath, 'wb') as f:
            f.write(content)
        print(f'Fixed {changes} replacements in {os.path.basename(fpath)}')
        total_changes += changes
    else:
        # Also try the simpler pattern where only some bytes are doubled
        pass

print(f'\nTotal: {total_changes} replacements across {len(files)} files')

# Verify admin.html
with open(os.path.join(folder, 'admin.html'), 'rb') as f:
    data = f.read()
# Check for remaining garbled patterns
import re
garbled = re.findall(rb'\xc3[\xb0\xa2][\xc2\xc3]', data)
if garbled:
    print(f'\nWARNING: {len(garbled)} potential garbled sequences still remain')
    # Show context around first few
    for g in garbled[:3]:
        idx = data.find(g)
        context = data[max(0,idx-20):idx+30]
        print(f'  Context: {context}')
else:
    print('\nNo garbled sequences detected - all clean!')
