# PowerShell script to start GM ARCH TOOLS local server
$ErrorActionPreference = "Stop"

$nodePath = "C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe"

if (Test-Path $nodePath) {
    Write-Host "Starting GM ARCH TOOLS using Node.js..." -ForegroundColor Cyan
    & $nodePath "server.js"
} else {
    Write-Host "Node.js not found at standard path. Launching simple PowerShell HTTP Listener on port 3000..." -ForegroundColor Yellow
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:3000/")
    $listener.Start()
    Write-Host "Listening at http://localhost:3000/ ..." -ForegroundColor Green
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/" -or $localPath -eq "") { $localPath = "/index.html" }
        $filePath = Join-Path $PSScriptRoot ($localPath.TrimStart('/'))
        
        if (Test-Path $filePath) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
}
