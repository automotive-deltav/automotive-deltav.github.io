import os

fpath = r'c:\Users\Andrei\Downloads\DeltaV\admin_local\admin.html'
with open(fpath, 'rb') as f:
    data = f.read()

# Search for "Refresh" and show bytes before it
idx = data.find(b'Refresh</button')
if idx > 0:
    chunk = data[idx-20:idx+20]
    print(f'Around "Refresh": {chunk}')
    print(f'Hex: {chunk.hex(" ")}')

# Search for "Export" 
idx = data.find(b'Export</button')
if idx > 0:
    chunk = data[idx-20:idx+20]
    print(f'\nAround "Export": {chunk}')
    print(f'Hex: {chunk.hex(" ")}')

# Search for "Confirm Delete"
idx = data.find(b'Confirm Delete')
if idx > 0:
    chunk = data[idx-20:idx+20]
    print(f'\nAround "Confirm Delete": {chunk}')
    print(f'Hex: {chunk.hex(" ")}')

# Search for "Contact</span"
idx = data.find(b'Contact</span')
if idx > 0:
    chunk = data[idx-20:idx+20]
    print(f'\nAround "Contact": {chunk}')
    print(f'Hex: {chunk.hex(" ")}')

# Search for "Customer</div"
idx = data.find(b'Customer</div')
if idx > 0:
    chunk = data[idx-20:idx+20]
    print(f'\nAround "Customer": {chunk}')
    print(f'Hex: {chunk.hex(" ")}')

# Search for "Service Details"
idx = data.find(b'Service Details')
if idx > 0:
    chunk = data[idx-20:idx+20]
    print(f'\nAround "Service Details": {chunk}')
    print(f'Hex: {chunk.hex(" ")}')

# Find all non-ASCII sequences 
print('\n--- All non-ASCII sequences (potential garbled) ---')
i = 0
found = 0
while i < len(data) and found < 30:
    b = data[i]
    if b > 127:
        # Found non-ASCII byte, grab context
        start = max(0, i-10)
        end = min(len(data), i+15)
        chunk = data[start:end]
        # Only show if it looks garbled (starts with C3 or similar)
        if b in (0xC3, 0xC2) and i+1 < len(data):
            context_start = max(0, i-30)
            context_end = min(len(data), i+30)
            context = data[context_start:context_end]
            try:
                text_context = context.decode('utf-8', errors='replace')
            except:
                text_context = str(context)
            print(f'\n  Offset {i}: byte=0x{b:02x}')
            print(f'  Hex: {data[i:min(i+12,len(data))].hex(" ")}')
            print(f'  Context: {text_context}')
            found += 1
            # Skip this multi-byte sequence
            while i < len(data) and data[i] > 127:
                i += 1
            continue
    i += 1
