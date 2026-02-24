import os, glob

folder = r'c:\Users\Andrei\Downloads\DeltaV\admin_local'
files = glob.glob(os.path.join(folder, '*.html'))

# The footer to add
new_footer = '''  <div class="sb-foot" style="display:flex;flex-direction:column;gap:8px">
    <input type="text" id="quickNavSearch" placeholder="🔍 Go to page..." style="padding:8px;border:1px solid #e2e8f0;border-radius:6px;font-size:.85rem" onkeypress="if(event.key==='Enter') quickNav()">
    <button class="btn btn-ghost btn-sm" onclick="showPageGuide()" style="border:1px solid #e2e8f0" title="📚 View all pages">📚 Guide</button>
  </div>'''

updated = 0
for fpath in files:
    fname = os.path.basename(fpath)
    if fname == 'dashboard.html':
        continue  # Already updated
    
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if it already has the new footer
    if 'quickNavSearch' in content:
        print(f'Skipped: {fname} (already has new footer)')
        continue
    
    # Find </nav> and add footer after it
    if '</nav>' in content:
        # Replace </nav>\n</div> with </nav>\n{footer}\n</div>
        old_pattern = '</nav>\n</div>'
        new_pattern = f'</nav>\n{new_footer}\n</div>'
        
        if old_pattern in content:
            content = content.replace(old_pattern, new_pattern)
            with open(fpath, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            updated += 1
            print(f'Updated: {fname}')
        else:
            # Try without newline
            old_pattern2 = '</nav></div>'
            new_pattern2 = f'</nav>\n{new_footer}\n</div>'
            if old_pattern2 in content:
                content = content.replace(old_pattern2, new_pattern2)
                with open(fpath, 'w', encoding='utf-8', newline='') as f:
                    f.write(content)
                updated += 1
                print(f'Updated: {fname}')
            else:
                print(f'Skipped: {fname} (could not find nav closing pattern)')

print(f'\nDone! Updated {updated} files.')
