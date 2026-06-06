param(
  [switch]$Force,
  [switch]$Quiet,
  [switch]$All
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$t0 = Get-Date

function Log {
  param([string]$Msg, [string]$Color = "Gray")
  if (-not $Quiet) { Write-Host "  $Msg" -ForegroundColor $Color }
}

if (-not $Quiet) {
  Write-Host ""
  Write-Host "╔══════════════════════════════════════╗" -ForegroundColor Cyan
  Write-Host "║    SA OrbitForge - Cleanup v3         ║" -ForegroundColor Cyan
  Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Cyan
  Write-Host ""
}

# ─── 1. Kill ALL node processes ──────────────────────────────
Log "Killing node processes..." "DarkGray"
$before = @(Get-Process -Name "node" -ErrorAction SilentlyContinue).Count
$null = & "taskkill" "/f" "/im" "node.exe" "/t" 2>&1
Start-Sleep -Milliseconds 800
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
$after = @(Get-Process -Name "node" -ErrorAction SilentlyContinue).Count
$killed = $before - $after
if ($killed -gt 0) { Log "Killed $killed node process(es)." "Green" }
else { Log "No node processes found." "Green" }

# ─── 2. Free port 3000 ──────────────────────────────────────
Log "Freeing port 3000..." "DarkGray"
try {
  $conn = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
  if ($conn) {
    $owner = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    if ($owner) {
      Log "Port 3000 held by $($owner.ProcessName) PID $($owner.Id)" "Yellow"
      $owner | Stop-Process -Force -ErrorAction SilentlyContinue
      Start-Sleep -Seconds 1
    }
  }
  $stillHeld = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
  if (-not $stillHeld) { Log "Port 3000 is free." "Green" }
  else { Log "Port 3000 still in use." "Red" }
} catch {
  Log "Could not check port 3000." "Yellow"
}

# ─── 3. Clean stale lock files ──────────────────────────────
Log "Cleaning stale lock files..." "DarkGray"
$locks = @(
  ".next\dev\lock", ".next\lock",
  "prisma\dev.db-journal", "prisma\dev.db-wal", "prisma\dev.db-shm"
)
$cleaned = 0
foreach ($lock in $locks) {
  $path = Join-Path -Path $ProjectRoot -ChildPath $lock
  if (Test-Path -LiteralPath $path -PathType Leaf) {
    try { Remove-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue; $cleaned++ } catch {}
  }
}
if ($cleaned -gt 0) { Log "Cleaned $cleaned stale lock(s)." "Green" }
else { Log "No stale locks found." "Green" }

# ─── 4. Clean .next cache ──────────────────────────────────
$nextDir = Join-Path -Path $ProjectRoot -ChildPath ".next"
$shouldClean = $Force -or $All
if (-not $shouldClean -and (Test-Path -LiteralPath $nextDir)) {
  $nextAge = ((Get-Date) - (Get-Item -LiteralPath $nextDir).LastWriteTime).TotalHours
  if ($nextAge -gt 4) { $shouldClean = $true }
}
if ($shouldClean -and (Test-Path -LiteralPath $nextDir)) {
  Log "Cleaning .next cache..." "DarkGray"
  try {
    Remove-Item -LiteralPath $nextDir -Recurse -Force -ErrorAction SilentlyContinue
    Log ".next cache cleaned." "Green"
  } catch {
    Log "Could not fully clean .next (files in use). Retrying..." "Yellow"
    Start-Sleep -Seconds 2
    try { Remove-Item -LiteralPath $nextDir -Recurse -Force -ErrorAction SilentlyContinue; Log ".next cache cleaned on retry." "Green" }
    catch { Log "Could not clean .next — run cleanup.ps1 -All before starting." "Red" }
  }
} else {
  Log ".next cache is fresh, keeping for fast restart." "Green"
}

# ─── 5. Clean webpack cache if corrupted ────────────────────
$wpcache = Join-Path -Path $ProjectRoot -ChildPath ".next\webpack-cache"
if ($All -and (Test-Path -LiteralPath $wpcache)) {
  Log "Cleaning webpack filesystem cache..." "DarkGray"
  try { Remove-Item -LiteralPath $wpcache -Recurse -Force -ErrorAction SilentlyContinue; Log "Webpack cache cleaned." "Green" }
  catch { Log "Could not clean webpack cache." "Yellow" }
}

# ─── 6. Clean npm cache if too large ───────────────────────
$npmCache = Join-Path -Path $ProjectRoot -ChildPath "node_modules\.cache"
if (Test-Path -LiteralPath $npmCache) {
  try {
    $cacheSize = (Get-ChildItem -LiteralPath $npmCache -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
    if ($cacheSize -gt 200MB) {
      Log "npm cache is $([math]::Round($cacheSize/1MB,0))MB — cleaning..." "Yellow"
      Remove-Item -LiteralPath $npmCache -Recurse -Force -ErrorAction SilentlyContinue
      Log "npm cache cleaned." "Green"
    }
  } catch {}
}

# ─── 7. Clean Next.js build artifacts ──────────────────────
$tsBuildInfo = Join-Path -Path $ProjectRoot -ChildPath "tsconfig.tsbuildinfo"
if (Test-Path -LiteralPath $tsBuildInfo) {
  try { Remove-Item -LiteralPath $tsBuildInfo -Force -ErrorAction SilentlyContinue; Log "Removed tsbuildinfo." "Green" } catch {}
}

# ─── Summary ──────────────────────────────────────────────
$elapsed = (Get-Date) - $t0
Log "Cleanup complete in $("{0:N1}s" -f $elapsed.TotalSeconds)" "Cyan"
Log "Tip: Run PowerShell as Admin: .\add-defender-exclusion.ps1" "DarkGray"
Log "      (excludes project from Windows Defender scanning)" "DarkGray"
