"""Fix CP1252-double-encoded emojis in admin HTML files.

The encoding chain was: UTF-8 -> interpreted as CP1252 -> re-encoded as UTF-8.
To reverse: decode UTF-8 -> encode as CP1252 -> decode as UTF-8.
"""
import os
import re
import glob

def fix_double_encoding(text):
    """Try to fix doubled-encoded segments in text."""
    result = []
    i = 0
    while i < len(text):
        # Look for sequences that start with chars typical of double-encoding
        # CP1252 double-encoded 4-byte UTF-8 emojis start with U+00F0 (ð)
        if text[i] == '\u00f0' and i + 3 < len(text):
            # Try to grab a chunk and reverse the double-encoding
            for end in range(min(i + 12, len(text)), i + 2, -1):
                chunk = text[i:end]
                try:
                    fixed = chunk.encode('cp1252').decode('utf-8')
                    result.append(fixed)
                    i = end
                    break
                except (UnicodeEncodeError, UnicodeDecodeError):
                    continue
            else:
                result.append(text[i])
                i += 1
        # CP1252 double-encoded 3-byte UTF-8 chars start with U+00E2 (â)
        elif text[i] == '\u00e2' and i + 2 < len(text):
            for end in range(min(i + 9, len(text)), i + 2, -1):
                chunk = text[i:end]
                try:
                    fixed = chunk.encode('cp1252').decode('utf-8')
                    result.append(fixed)
                    i = end
                    break
                except (UnicodeEncodeError, UnicodeDecodeError):
                    continue
            else:
                result.append(text[i])
                i += 1
        # Also handle U+00C3 (Ã) which could be a double-encoded 2-byte char
        elif text[i] == '\u00c3' and i + 1 < len(text):
            for end in range(min(i + 4, len(text)), i + 1, -1):
                chunk = text[i:end]
                try:
                    fixed = chunk.encode('cp1252').decode('utf-8')
                    # Only accept if the result is different and "makes sense"
                    if fixed != chunk and len(fixed) < len(chunk):
                        result.append(fixed)
                        i = end
                        break
                except (UnicodeEncodeError, UnicodeDecodeError):
                    continue
            else:
                result.append(text[i])
                i += 1
        else:
            result.append(text[i])
            i += 1
    return ''.join(result)


folder = r'c:\Users\Andrei\Downloads\DeltaV\admin_local'
files = glob.glob(os.path.join(folder, '*.html'))

total_fixed = 0
for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    fixed = fix_double_encoding(content)
    
    if fixed != content:
        changes = sum(1 for a, b in zip(content, fixed) if a != b)
        with open(fpath, 'w', encoding='utf-8', newline='') as f:
            f.write(fixed)
        fname = os.path.basename(fpath)
        print(f'Fixed: {fname} ({changes} chars changed)')
        total_fixed += 1
    
print(f'\nDone! Fixed {total_fixed} files out of {len(files)} total.')

# Verify admin.html
with open(os.path.join(folder, 'admin.html'), 'r', encoding='utf-8') as f:
    text = f.read()

# Check for remaining mojibake indicators
mojibake_patterns = ['\u00f0\u0178', '\u00e2\u20ac', '\u00c3\u00af']
remaining = 0
for pat in mojibake_patterns:
    count = text.count(pat)
    if count:
        remaining += count
        print(f'WARNING: Still found {count} instances of mojibake pattern: {repr(pat)}')

if remaining == 0:
    print('Verification: admin.html is clean - no mojibake detected!')
