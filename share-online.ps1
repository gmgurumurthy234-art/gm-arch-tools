# One-click PowerShell script to host and share GM ARCH TOOLS publicly
$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "      GM ARCH TOOLS — PUBLIC CLOUD SHARING LAUNCHER       " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$nodePath = "C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe"
$cloudflaredPath = Join-Path $PSScriptRoot "bin\cloudflared.exe"

# 1. Start local server if not already running on port 3000
$portInUse = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if (-not $portInUse) {
    Write-Host "Starting local web server on port 3000..." -ForegroundColor Green
    Start-Process -FilePath $nodePath -ArgumentList "server.js" -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "Local web server is already running on port 3000." -ForegroundColor Green
}

# 2. Check cloudflared binary
if (-not (Test-Path $cloudflaredPath)) {
    Write-Host "Downloading cloudflared..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot "bin") | Out-Null
    Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cloudflaredPath
}

# 3. Start Cloudflare Tunnel
Write-Host "`nLaunching global secure public HTTPS tunnel..." -ForegroundColor Cyan
Write-Host "Anyone on ANY phone, tablet, or PC on any network can access this URL.`n" -ForegroundColor White

& $cloudflaredPath tunnel --url http://127.0.0.1:3000
