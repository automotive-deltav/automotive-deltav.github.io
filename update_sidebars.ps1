# Update sidebar footer in all admin HTML files
$oldFooter = @'
  <div class="sb-foot">
    <a href="index.html" class="btn-sb-link">🌐 Website</a>
    <button class="btn-sb-out" onclick="if(confirm('Log out?')){sessionStorage.removeItem('dv_admin');location.href='login.html';}">🚪 Log Out</button>
  </div>
'@

$newFooter = @'
  <div class="sb-foot" style="display:flex;flex-direction:column;gap:8px">
    <input type="text" id="quickNavSearch" placeholder="🔍 Go to page..." style="padding:8px;border:1px solid #e2e8f0;border-radius:6px;font-size:.85rem" onkeypress="if(event.key==='Enter') quickNav()">
    <button class="btn btn-ghost btn-sm" onclick="showPageGuide()" style="border:1px solid #e2e8f0" title="📚 View all pages">📚 Guide</button>
    <button class="btn btn-ghost btn-sm" onclick="toggleDarkMode()" style="border:1px solid #e2e8f0">🌙 Theme</button>
    <button class="btn btn-danger btn-sm" onclick="if(confirm('Log out?')){sessionStorage.removeItem('dv_admin');location.href='login.html';}">🚪 Log Out</button>
  </div>
'@

$adminPath = "c:\Users\Andrei\Downloads\DeltaV\admin_local"
$htmlFiles = Get-ChildItem -Path $adminPath -Filter "*.html"

$updated = 0
$skipped = 0

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    
    if ($content -like "*btn-sb-out*") {
        $newContent = $content -replace [regex]::Escape($oldFooter), $newFooter
        Set-Content $file.FullName $newContent -Encoding UTF8
        Write-Host "[OK] Updated: $($file.Name)"
        $updated++
    } else {
        Write-Host "[SKIP] Skipped: $($file.Name)"
        $skipped++
    }
}

Write-Host "`n[DONE] $updated updated, $skipped skipped"
