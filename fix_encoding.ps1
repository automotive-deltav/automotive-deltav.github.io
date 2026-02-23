# Fix UTF-8 encoding in all HTML files
$adminPath = "c:\Users\Andrei\Downloads\DeltaV\admin_local"
$files = Get-ChildItem -Path $adminPath -Filter "*.html"

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
    Write-Host "Fixed: $($file.Name)"
}

Write-Host "All files re-encoded to UTF-8"
