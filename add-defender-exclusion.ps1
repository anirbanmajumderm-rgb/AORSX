<#
.SYNOPSIS
    Adds Windows Defender exclusions for the Next.js project to prevent
    real-time scanning from slowing down dev server startup and HMR.
.DESCRIPTION
    Windows Defender real-time scanning is a MAJOR cause of slow Node.js
    startup on Windows. This script adds exclusions for the project's
    cache and build directories so Defender doesn't scan them on every
    file read/write.
.NOTES
    Requires Administrator privileges. Run this ONCE after project setup.
    If you move the project, run this script again.
#>

param(
    [switch]$Help,
    [switch]$Remove,
    [switch]$Status
)

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ErrorActionPreference = "Continue"

if ($Help) {
    Write-Host ""
    Write-Host "SA OrbitForge - Windows Defender Exclusion Helper" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  .\add-defender-exclusion.ps1              # Add exclusions (Admin)"
    Write-Host "  .\add-defender-exclusion.ps1 -Remove      # Remove exclusions"
    Write-Host "  .\add-defender-exclusion.ps1 -Status      # Check current exclusions"
    Write-Host ""
    Write-Host "  Run as Administrator for best results." -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

# Exclusions to add — these are the directories Defender would scan on every access
$Exclusions = @(
    "$ProjectRoot\.next",
    "$ProjectRoot\node_modules\.cache",
    "$ProjectRoot\prisma\dev.db",
    "$ProjectRoot\.next\webpack-cache"
)

function Check-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Check-Admin)) {
    Write-Host ""
    Write-Host "WARNING: Not running as Administrator." -ForegroundColor Yellow
    Write-Host "Some exclusions may require admin rights." -ForegroundColor Yellow
    Write-Host "Right-click PowerShell and select 'Run as Administrator'." -ForegroundColor Yellow
    Write-Host ""
}

if ($Status) {
    Write-Host ""
    Write-Host "Current Windows Defender Exclusions:" -ForegroundColor Cyan
    Write-Host ""
    try {
        $current = Get-MpPreference -ErrorAction SilentlyContinue
        if ($current.ExclusionPath) {
            foreach ($excl in $current.ExclusionPath) {
                $icon = if ($Exclusions -contains $excl) { "[ACTIVE]" } else { "[OTHER]" }
                $color = if ($Exclusions -contains $excl) { "Green" } else { "DarkGray" }
                Write-Host "  $icon " -NoNewline -ForegroundColor $color
                Write-Host "$excl" -ForegroundColor Gray
            }
        } else {
            Write-Host "  No exclusions configured." -ForegroundColor DarkGray
        }
        Write-Host ""
        $pending = $Exclusions | Where-Object { $_ -notin $current.ExclusionPath }
        if ($pending) {
            Write-Host "Not yet excluded (run without -Status to add):" -ForegroundColor Yellow
            foreach ($p in $pending) {
                Write-Host "  $p" -ForegroundColor DarkGray
            }
        } else {
            Write-Host "All project exclusions are active." -ForegroundColor Green
        }
    } catch {
        Write-Host "  Could not query Defender status." -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor DarkGray
    }
    Write-Host ""
    exit 0
}

if ($Remove) {
    Write-Host ""
    Write-Host "Removing Windows Defender exclusions..." -ForegroundColor DarkGray
    foreach ($excl in $Exclusions) {
        try {
            Remove-MpPreference -ExclusionPath $excl -ErrorAction SilentlyContinue
            Write-Host "  Removed: $excl" -ForegroundColor Green
        } catch {
            Write-Host "  Failed: $excl" -ForegroundColor Red
        }
    }
    Write-Host "Done." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Windows Defender Exclusion Setup              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "Adding exclusions for Next.js cache directories..." -ForegroundColor DarkGray
Write-Host "This prevents slowdown from real-time scanning." -ForegroundColor DarkGray
Write-Host ""

$added = 0
$skipped = 0
$failed = 0

foreach ($excl in $Exclusions) {
    try {
        Add-MpPreference -ExclusionPath $excl -ErrorAction SilentlyContinue
        Write-Host "  [OK] Added: $excl" -ForegroundColor Green
        $added++
    } catch {
        Write-Host "  [FAIL] Error adding: $excl" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
if ($added -gt 0) {
    Write-Host "Successfully added $added exclusion(s)." -ForegroundColor Green
    Write-Host ""
    Write-Host "Effect: Windows Defender will skip scanning these" -ForegroundColor DarkGray
    Write-Host "directories, significantly improving Node.js/Webpack" -ForegroundColor DarkGray
    Write-Host "startup and HMR speed on Windows." -ForegroundColor DarkGray
}
if ($failed -gt 0) {
    Write-Host "$failed exclusion(s) failed. Try running as Administrator." -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Optional: To verify, run: .\add-defender-exclusion.ps1 -Status" -ForegroundColor DarkGray
Write-Host ""
