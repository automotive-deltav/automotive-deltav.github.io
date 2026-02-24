"""Fix remaining double-encoded emojis that the previous script missed.

The issue: Python's cp1252 codec can't encode control chars like U+008F,
which appear in the garbled text. This script works at the byte level.
"""
import os, glob

folder = r'c:\Users\Andrei\Downloads\DeltaV\admin_local'

# Build a custom CP1252 encode table including undefined byte positions
cp1252_encode = {}
for i in range(256):
    try:
        char = bytes([i]).decode('cp1252')
        cp1252_encode[char] = bytes([i])
    except:
        cp1252_encode[chr(i)] = bytes([i])

# Also ensure control chars in 0x80-0x9F undefined range get identity mapping
for i in [0x81, 0x8D, 0x8F, 0x90, 0x9D]:
    cp1252_encode[chr(i)] = bytes([i])

def custom_cp1252_encode(s):
    """Encode string to bytes using CP1252 with fallback for undefined positions."""
    result = bytearray()
    for c in s:
        if c in cp1252_encode:
            result.extend(cp1252_encode[c])
        else:
            raise ValueError(f"Cannot encode {repr(c)} (U+{ord(c):04X})")
    return bytes(result)

def fix_double_encoding(text):
    """Try to fix CP1252-double-encoded segments in text."""
    result = []
    i = 0
    while i < len(text):
        ch = text[i]
        code = ord(ch)
        
        # Detect double-encoded sequences by first byte patterns
        # 4-byte UTF-8 emoji start with F0, which becomes U+00F0 in Latin-1 or similar
        if code == 0x00F0 or code in (0x00E2, 0x00C3, 0x00EF, 0x00C2):
            best_fix = None
            best_end = i + 1
            
            # Try chunks from longest to shortest
            for end in range(min(i + 12, len(text)), i + 1, -1):
                chunk = text[i:end]
                try:
                    raw = custom_cp1252_encode(chunk)
                    decoded = raw.decode('utf-8')
                    # Success - this chunk was double-encoded
                    if decoded != chunk:
                        best_fix = decoded
                        best_end = end
                        break
                except (ValueError, UnicodeDecodeError):
                    continue
            
            if best_fix is not None:
                result.append(best_fix)
                i = best_end
            else:
                result.append(ch)
                i += 1
        else:
            result.append(ch)
            i += 1
    
    return ''.join(result)

files = glob.glob(os.path.join(folder, '*.html'))
total_fixed = 0

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    fixed = fix_double_encoding(content)
    
    if fixed != content:
        # Count actual differences
        old_chars = list(content)
        new_chars = list(fixed)
        with open(fpath, 'w', encoding='utf-8', newline='') as f:
            f.write(fixed)
        fname = os.path.basename(fpath)
        print(f'Fixed: {fname}')
        total_fixed += 1

print(f'\nDone! Fixed {total_fixed} files out of {len(files)} total.')

# Verify: check for remaining garbled markers
remaining_issues = 0
for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        text = f.read()
    fname = os.path.basename(fpath)
    
    # Check for garbled variation selector pattern
    if '\u00ef\u00b8' in text:
        remaining_issues += 1
        print(f'WARNING: {fname} still has garbled variation selector')
    if '\u00e2\u0153' in text or '\u00e2\u20ac' in text:
        remaining_issues += 1
        print(f'WARNING: {fname} still has garbled 3-byte sequence')
    if '\u00f0\u0178' in text or '\u00f0\u00b8' in text:
        remaining_issues += 1
        print(f'WARNING: {fname} still has garbled 4-byte sequence')

if remaining_issues == 0:
    print('All files verified clean!')
