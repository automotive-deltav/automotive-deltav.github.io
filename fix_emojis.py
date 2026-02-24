import os

fixes = {
    '\u00c3\u00b0\u00c5\u00b8\u00e2\u0080\u0099\u00c2\u00a4': '\U0001f464',  # skip complex
}

# Better approach: use the actual mojibake mapping
mojibake_map = {
    'ðŸŒ': '\U0001f310',       # 🌐
    'ðŸšª': '\U0001f6aa',       # 🚪
    'ðŸ\x94„': '\U0001f504',   # 🔄
    'ðŸ\x94¥': '\U0001f4e5',   # 📥 - actually this is fire
    'ðŸ\x97\x91ï¸': '\U0001f5d1\ufe0f',  # 🗑️
    'ðŸ\x93ž': '\U0001f4de',   # 📞
    'ðŸ\x91¤': '\U0001f464',   # 👤
    'ðŸ\x94§': '\U0001f527',   # 🔧
    'ðŸ\x93Œ': '\U0001f4cc',   # 📌
    'â\x80"': '\u2014',         # —
    'â\x80¢': '\u2022',         # •
    'âœ"': '\u2713',             # ✓
    'â–¼': '\u25bc',             # ▼
}

# Simpler: just use string replacements
simple_fixes = [
    ('ðŸŒ', '🌐'),
    ('ðŸšª', '🚪'),
    ('ðŸ"„', '🔄'),
    ('ðŸ"¥', '📥'),
    ('ðŸ—'ï¸', '🗑️'),
    ('ðŸ"ž', '📞'),
    ('ðŸ'¤', '👤'),
    ('ðŸ"§', '🔧'),
    ('ðŸ"Œ', '📌'),
    ('â\u0080\u0094', '—'),
    ('â\u0080\u0093', '–'),
    ('â\u0080\u00a2', '•'),
    ('â\u0080\u009c', '"'),
    ('â\u0080\u009d', '"'),
    ('â\u009c\u0094', '✓'),
    ('â\u0096\u00bc', '▼'),
]

folder = r'c:\Users\Andrei\Downloads\DeltaV\admin_local'
count = 0
for fname in os.listdir(folder):
    if not fname.endswith('.html'):
        continue
    fpath = os.path.join(folder, fname)
    
    # Read as bytes first
    with open(fpath, 'rb') as f:
        raw = f.read()
    
    text = raw.decode('utf-8', errors='replace')
    original = text
    
    for bad, good in simple_fixes:
        text = text.replace(bad, good)
    
    if text != original:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(text)
        count += 1
        print(f'Fixed: {fname}')
    else:
        # Check if still has garbled chars
        if 'ðŸ' in text or 'â€' in text:
            print(f'Still has issues: {fname}')

print(f'\nDone! Fixed {count} files')
