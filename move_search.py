import os, glob

folder = r'c:\Users\Andrei\Downloads\DeltaV\admin_local'
files = glob.glob(os.path.join(folder, '*.html'))

# New search bar to put after sb-logo (before nav)
new_search = '''  <div style="padding:8px;margin-bottom:12px">
    <div style="position:relative">
      <input type="text" id="quickNavSearch" placeholder="🔍 Go to page..." style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;font-size:.85rem;background:#f8fafc;color:#1e293b" oninput="DeltaV._updateNavSuggestions()" onkeypress="if(event.key==='Enter') quickNav()" onclick="if(this.value) DeltaV._showNavSuggestions()">
      <div id="navSuggestionsDropdown" style="position:absolute;top:100%;left:0;right:0;background:white;border:1px solid #cbd5e1;border-top:none;border-radius:0 0 6px 6px;max-height:300px;overflow-y:auto;display:none;z-index:1000;box-shadow:0 4px 6px rgba(0,0,0,.1)"></div>
    </div>
  </div>'''

updated = 0
for fpath in files:
    fname = os.path.basename(fpath)
    if fname in ['login.html', 'invoice-print.html', 'settings_advanced.html']:
        continue
    
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip if already has the new search structure
    if 'navSuggestionsDropdown' in content:
        print(f'Skipped: {fname} (already updated)')
        continue
    
    # Remove old search from footer if present
    old_search_footer = '''    <input type="text" id="quickNavSearch" placeholder="🔍 Go to page..." style="padding:8px;border:1px solid #e2e8f0;border-radius:6px;font-size:.85rem" onkeypress="if(event.key==='Enter') quickNav()">'''
    if old_search_footer in content:
        content = content.replace(old_search_footer, '')
    
    # Find sb-logo closing and add search after it
    logo_pattern = '</div>\n  <nav>'
    replacement = f'</div>\n{new_search}\n  <nav>'
    
    if logo_pattern in content:
        content = content.replace(logo_pattern, replacement, 1)
        with open(fpath, 'w', encoding='utf-8', newline='') as f:
            f.write(content)
        updated += 1
        print(f'Updated: {fname}')
    else:
        print(f'Skipped: {fname} (could not find insertion point)')

print(f'\nDone! Updated {updated} files.')
