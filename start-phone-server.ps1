Set-Location $PSScriptRoot
if (Get-Command py -ErrorAction SilentlyContinue) {
    py -3 server.py
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    python server.py
} else {
    Write-Host "Python 3 was not found. Install it, then run this file again." -ForegroundColor Red
    Read-Host "Press Enter to close"
}
