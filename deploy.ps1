param(
  [string]$message = "Update GM ARCH TOOLS"
)

$ErrorActionPreference = "Stop"

$gitExe = "$PSScriptRoot\bin\git\cmd\git.exe"
if (-not (Test-Path $gitExe)) {
  $gitExe = "git"
}

Write-Host ">>> Checking workspace status..." -ForegroundColor Cyan
& $gitExe status -s

Write-Host ">>> Staging changes..." -ForegroundColor Cyan
& $gitExe add .

$status = & $gitExe status -s
if ($status) {
  Write-Host ">>> Committing: $message" -ForegroundColor Cyan
  & $gitExe commit -m $message
} else {
  Write-Host ">>> No uncommitted changes detected. Ensuring cloud is up to date..." -ForegroundColor Yellow
}

Write-Host ">>> Pushing to GitHub Cloud Edge CDN..." -ForegroundColor Cyan
& $gitExe push origin main

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  SUCCESSFULLY DEPLOYED TO PRODUCTION!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host "Production URL : https://gmgurumurthy234-art.github.io/gm-arch-tools/" -ForegroundColor Yellow
Write-Host "Repository     : https://github.com/gmgurumurthy234-art/gm-arch-tools" -ForegroundColor Gray
Write-Host "All devices will load this latest version automatically.`n" -ForegroundColor DarkGray
