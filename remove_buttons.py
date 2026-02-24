import os, glob

folder = r'c:\Users\Andrei\Downloads\DeltaV\admin_local'
files = glob.glob(os.path.join(folder, '*.html'))

# Pattern to remove: the entire sb-foot div with Website and Log Out buttons
pattern = '''  <div class="sb-foot">
    <a href="index.html" class="btn-sb-link">🌐 Website</a>
    <button class="btn-sb-out" onclick="if(confirm('Log out?')){sessionStorage.removeItem('dv_admin');location.href='login.html';}">🚪 Log Out</button>
  </div>'''

removed = 0
for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if pattern in content:
        content = content.replace(pattern, '')
        with open(fpath, 'w', encoding='utf-8', newline='') as f:
            f.write(content)
        removed += 1
        print(f'Removed buttons from {os.path.basename(fpath)}')

print(f'\nDone! Removed sidebar buttons from {removed} files.')
