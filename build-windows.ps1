$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js 20.19 o superior es requerido.'
}

Write-Host "Node.js: $(node -p 'process.versions.node')"

if (-not (Test-Path 'node_modules')) {
  try { npm install } catch {
    Write-Host 'npm install fallo; reintentando con --legacy-peer-deps...' -ForegroundColor Yellow
    npm install --legacy-peer-deps
  }
}

if (Test-Path 'dist') { Remove-Item 'dist' -Recurse -Force }
if (Test-Path 'release') { Remove-Item 'release' -Recurse -Force }

npm run build
npx electron-builder --win portable --x64

Write-Host "EXE generado en .\release" -ForegroundColor Green
Get-ChildItem .\release\*.exe
