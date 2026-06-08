@echo off
title SA OrbitForge - Dev Server (Webpack Stable)
cd /d "%~dp0"

setlocal enabledelayedexpansion

echo.
echo ==============================================
echo    SA OrbitForge - Dev Server Launcher (v3)
echo    Webpack ^| Port 3000 ^| Node.js
echo ==============================================
echo.

:: ─── Phase 1: Kill orphan Node processes ────────────────────────────
echo [1/5] Killing orphan Node processes...
taskkill /f /im node.exe /t 2>nul
powershell -NoProfile -Command "Start-Sleep -Milliseconds 800" 2>nul
echo       Done.

:: ─── Phase 2: Free port 3000 ────────────────────────────────────────
echo [2/5] Checking port 3000...
powershell -NoProfile -Command "
try {
  $c = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue;
  if ($c) {
    $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue;
    if ($p) { $p | Stop-Process -Force; Start-Sleep 1 }
    Write-Host '       Port 3000 freed.'
  } else {
    Write-Host '       Port 3000 is free.'
  }
} catch { Write-Host '       Port 3000 is free.' }" 2>nul
echo.

:: ─── Phase 3: Clean stale lock files ────────────────────────────────
echo [3/5] Cleaning stale cache and lock files...
if exist ".next\lock" del /f /q ".next\lock" 2>nul
if exist ".next\dev\lock" del /f /q ".next\dev\lock" 2>nul
if exist "prisma\dev.db-journal" del /f /q "prisma\dev.db-journal" 2>nul
if exist "prisma\dev.db-wal" del /f /q "prisma\dev.db-wal" 2>nul
if exist "prisma\dev.db-shm" del /f /q "prisma\dev.db-shm" 2>nul
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache" 2>nul
echo       Done.

:: ─── Phase 4: Quick DB check ────────────────────────────────────────
echo [4/5] Verifying database...
npx.cmd prisma generate --no-hints >nul 2>&1
if %errorlevel% neq 0 (
    echo       [WARN] DB generate failed — will retry on first request
) else (
    echo       Database ready.
)
echo.

:: ─── Phase 5: Start Next.js dev server ─────────────────────────────
echo [5/5] Starting Next.js dev server (Webpack)...
echo.

:: Set Node.js memory limit (conservative for 8-16GB systems)
set NODE_OPTIONS=--max-old-space-size=2048
set NEXT_TELEMETRY_DISABLED=1
set NODE_ENV=development

:: Start with Webpack (stable) — NOT Turbopack
npx.cmd next dev --port 3000

:: If server exits unexpectedly
if %errorlevel% neq 0 (
    echo.
    echo ==============================================
    echo    [ERROR] Server exited with code %errorlevel%
    echo    Possible causes:
    echo    - Port conflict: wait 10s, then restart
    echo    - Corrupted cache: run "npm run clean" then restart
    echo    - Memory limit: edit NODE_OPTIONS in this file
    echo ==============================================
    echo.
    echo Press any key to restart, or close this window...
    pause >nul
    start "" "%~f0"
    exit
)

endlocal
