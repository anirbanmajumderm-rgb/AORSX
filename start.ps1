$ErrorActionPreference = "SilentlyContinue"
Write-Host "[1/5] Killing orphan Node processes..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

Write-Host "[2/5] Freeing port 3000..."
try {
  $c = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
  if ($c) {
    Get-Process -Id $c.OwningProcess | Stop-Process -Force
    Start-Sleep 1
  }
} catch {}

Write-Host "[3/5] Cleaning stale lock files..."
@(".next\lock", ".next\dev\lock", "prisma\dev.db-journal", "prisma\dev.db-wal", "prisma\dev.db-shm") | ForEach-Object {
  if (Test-Path $_) { Remove-Item $_ -Force }
}

Write-Host "[4/5] Verifying database..."
npx.cmd prisma generate --no-hints 2>$null

Write-Host "[5/5] Starting Next.js dev server (Webpack)..."
$env:NODE_OPTIONS = "--max-old-space-size=2048"
$env:NEXT_TELEMETRY_DISABLED = 1
$env:NODE_ENV = "development"
npx.cmd next dev --port 3000
