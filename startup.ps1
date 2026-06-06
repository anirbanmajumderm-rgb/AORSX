param(
  [switch]$SkipKill,
  [switch]$SkipClean,
  [switch]$SkipDb,
  [switch]$SkipInstall,
  [switch]$SkipDev,
  [switch]$Help,
  [switch]$Quiet,
  [switch]$NoMonitor,
  [switch]$SkipDiagnostics,
  [switch]$Fast,
  [switch]$Heal
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ScriptVersion = "4.1.0"

# ─── Map -Fast and -Heal to existing flags ─────────────────────────
if ($Fast) {
  $SkipDiagnostics = $true
  $SkipKill = $true
  $SkipClean = $true
  $Quiet = $true
  $NoMonitor = $true
  if (-not $Heal) { $SkipDb = $true }
}

if ($Heal) {
  # Ensure nothing is skipped
  $SkipDiagnostics = $false
  $SkipKill = $false
  $SkipClean = $false
  $SkipDb = $false
  $SkipInstall = $false
  $NoMonitor = $false
  $Quiet = $false
}

$Host.UI.RawUI.WindowTitle = "Portfolio - Startup v$ScriptVersion $(
  if ($Fast) { '(FAST MODE)' } elseif ($Heal) { '(HEAL MODE)' } else { '(BALANCED MODE)' }
)"

$LogFile = Join-Path -Path $ProjectRoot -ChildPath "dev-startup.log"
$DevLog = Join-Path -Path $ProjectRoot -ChildPath "dev-server.log"
$DevErrLog = Join-Path -Path $ProjectRoot -ChildPath "dev-server-err.log"
$CrashLog = Join-Path -Path $ProjectRoot -ChildPath "dev-crash.log"
$DiagLog = Join-Path -Path $ProjectRoot -ChildPath "dev-diagnostics.json"

if (-not $Quiet) {
  $modeColor = if ($Fast) { "Green" } elseif ($Heal) { "Red" } else { "Cyan" }
  $Host.UI.RawUI.ForegroundColor = $modeColor
  $modeLabel = if ($Fast) { "FAST DAILY CODING" } elseif ($Heal) { "FULL RECOVERY" } else { "BALANCED" }
  Write-Host "╔══════════════════════════════════════════════════════════╗"
  Write-Host "║      Portfolio - Startup v$ScriptVersion                         ║"
  Write-Host "║  Mode: $($modeLabel.PadRight(42))║"
  Write-Host "╚══════════════════════════════════════════════════════════╝"
  $Host.UI.RawUI.ForegroundColor = "White"
}

if ($Help) {
  Write-Host ""
  Write-Host "Usage: .\startup.ps1 [options]"
  Write-Host ""
  Write-Host "Modes:"
  Write-Host "  (no flag)       Balanced — default startup with all checks"
  Write-Host "  -Fast           Fast daily dev — skip diagnostics, cleanup, DB"
  Write-Host "  -Heal           Full recovery — force all checks & cleanup"
  Write-Host ""
  Write-Host "Options:"
  Write-Host "  -SkipKill        Skip killing existing node processes"
  Write-Host "  -SkipClean       Skip cleaning .next cache"
  Write-Host "  -SkipDb          Skip database validation"
  Write-Host "  -SkipInstall     Skip npm install"
  Write-Host "  -SkipDev         Skip starting dev server"
  Write-Host "  -NoMonitor       Disable continuous health monitoring"
  Write-Host "  -SkipDiagnostics Skip environment diagnostics"
  Write-Host "  -Quiet           Minimize output"
  Write-Host "  -Help            Show this help"
  Write-Host ""
  Write-Host "Examples:"
  Write-Host "  .\startup.ps1                    # Balanced startup"
  Write-Host "  .\startup.ps1 -Fast              # Quick daily coding"
  Write-Host "  .\startup.ps1 -Heal              # Deep recovery"
  Write-Host "  .\startup.ps1 -SkipClean         # Keep .next cache"
  Write-Host "  .\startup.ps1 -SkipKill -Quiet   # Quick restart"
  Write-Host ""
  exit 0
}

# ─── Globals ───────────────────────────────────────────────────────────
$Global:PassedSteps = 0
$Global:FailedSteps = 0
$Global:SkippedSteps = 0
$Global:WarnSteps = 0
$script:StepTimings = @{}
$script:serverProcess = $null
$script:maxServerRestarts = 3
$script:serverRestartCount = 0
$script:PhaseTimings = @{}
$script:DiagData = @{}

# ─── Helper Functions ──────────────────────────────────────────────────
function Log-Step {
  param([string]$Message, [string]$Status = "INFO")
  $timestamp = Get-Date -Format "HH:mm:ss"
  $line = "[$timestamp] [$Status] $Message"
  Add-Content -Path $LogFile -Value $line
  if ($Quiet -and $Status -ne "FATAL" -and $Status -ne "ERROR") { return }
  switch ($Status) {
    "OK" { $Global:PassedSteps++; Write-Host "  [OK] $Message" -ForegroundColor Green }
    "WARN" { $Global:WarnSteps++; Write-Host "  [!] $Message" -ForegroundColor Yellow }
    "ERROR" { $Global:FailedSteps++; Write-Host "  [FAIL] $Message" -ForegroundColor Red }
    "SKIP" { $Global:SkippedSteps++; Write-Host "  [-] $Message" -ForegroundColor DarkGray }
    "FATAL" { $Global:FailedSteps++; Write-Host "  [FATAL] $Message" -ForegroundColor Red }
    default { Write-Host "  [>] $Message" -ForegroundColor Cyan }
  }
}

function Start-Timer { $script:Timer = Get-Date }

function Stop-Timer {
  $elapsed = (Get-Date) - $script:Timer
  return "{0:N1}s" -f $elapsed.TotalSeconds
}

function Get-ElapsedMs {
  $elapsed = (Get-Date) - $script:Timer
  return [math]::Round($elapsed.TotalMilliseconds)
}

function Invoke-WithRetry {
  param(
    [scriptblock]$ScriptBlock,
    [string]$Label,
    [int]$MaxRetries = 3,
    [int]$Delay = 2,
    [int]$Backoff = 2
  )
  $attempt = 1
  $currentDelay = $Delay
  do {
    try {
      $result = & $ScriptBlock
      return $result
    } catch {
      if ($attempt -ge $MaxRetries) {
        throw "$Label failed after $MaxRetries attempts: $_"
      }
      Log-Step "$Label attempt $attempt/$MaxRetries failed, retrying in ${currentDelay}s..." "WARN"
      Start-Sleep -Seconds $currentDelay
      $currentDelay = $currentDelay * $Backoff
    }
    $attempt++
  } while ($attempt -le $MaxRetries)
  throw "$Label failed after $MaxRetries attempts"
}

function Get-NpxCmd {
  if (Get-Command "npx.cmd" -ErrorAction SilentlyContinue) { return "npx.cmd" }
  if (Get-Command "npx" -ErrorAction SilentlyContinue) { return "npx" }
  return "npx"
}

function Write-Header {
  param([string]$Phase)
  if ($Quiet) { return }
  Write-Host ""
  Write-Host "  ── $Phase ──" -ForegroundColor DarkCyan
}

function Write-Section {
  param([string]$Title, [string]$Body)
  if ($Quiet) { return }
  Write-Host "  $Title " -NoNewline -ForegroundColor DarkGray
  Write-Host "$Body" -ForegroundColor Gray
}

function Start-Phase {
  param([string]$Name)
  $script:CurrentPhase = $Name
  $script:PhaseTimers[$Name] = Get-Date
}

function End-Phase {
  param([string]$Name)
  if ($script:PhaseTimers[$Name]) {
    $elapsed = (Get-Date) - $script:PhaseTimers[$Name]
    $script:PhaseTimings[$Name] = "{0:N1}s" -f $elapsed.TotalSeconds
  }
}

function Get-PhaseSummary {
  $lines = @()
  foreach ($key in $script:PhaseTimings.Keys) {
    $lines += @{ phase = $key; duration = $script:PhaseTimings[$key] }
  }
  return $lines
}

# ─── Initialize ────────────────────────────────────────────────────────
"" | Set-Content -Path $LogFile
$scriptStartTime = Get-Date

Log-Step "Startup Orchestrator v$ScriptVersion" "INFO"
Log-Step "Project root: $ProjectRoot" "INFO"
Log-Step "Mode: $(if ($Fast) { 'FAST' } elseif ($Heal) { 'HEAL' } else { 'BALANCED' })" "INFO"
Log-Step "PowerShell: $($PSVersionTable.PSVersion)" "INFO"
Log-Step "OS: $([Environment]::OSVersion)" "INFO"
Log-Step "User: $([Environment]::UserName)" "INFO"

# ═══════════════════════════════════════════════════════════════════════
# PHASE 1: Environment Diagnostics
# ═══════════════════════════════════════════════════════════════════════
Write-Header "Phase 1: Environment Diagnostics"
Start-Phase "Environment Diagnostics"

if (-not $SkipDiagnostics) {
  Start-Timer
  try {
    $nodeVersion = & node --version 2>&1
    Log-Step "Node.js $nodeVersion" "OK"
  } catch {
    Log-Step "Node.js not found in PATH. Please install Node.js" "FATAL"
    exit 1
  }
  $envDiagTime = Stop-Timer

  try {
    $npmVersion = & npm --version 2>&1
    Log-Step "npm v$npmVersion" "OK"
  } catch {
    Log-Step "npm not found" "WARN"
  }

  $osInfo = [Environment]::OSVersion
  $psVersion = $PSVersionTable.PSVersion
  $cpuInfo = Get-CimInstance Win32_Processor -ErrorAction SilentlyContinue | Select-Object -First 1
  $totalMem = (Get-CimInstance Win32_ComputerSystem -ErrorAction SilentlyContinue).TotalPhysicalMemory
  $memGb = if ($totalMem) { "{0:N1}GB" -f ($totalMem / 1GB) } else { "Unknown" }
  $cpuName = if ($cpuInfo) { $cpuInfo.Name.Trim() } else { "Unknown" }

  Write-Section "Working directory:" $ProjectRoot
  Write-Section "Node.js:" $nodeVersion
  Write-Section "npm:" $npmVersion
  Write-Section "OS:" "$($osInfo.VersionString)"
  Write-Section "CPU:" $cpuName
  Write-Section "RAM:" $memGb
  Write-Section "PowerShell:" "v$psVersion"

  $script:DiagData = @{
    nodeVersion = "$nodeVersion".Trim()
    npmVersion = "$npmVersion".Trim()
    os = "$($osInfo.VersionString)"
    cpu = $cpuName
    memory = $memGb
    powershell = "v$psVersion"
  }

  $script:DiagData | ConvertTo-Json -Compress | Set-Content -Path $DiagLog
  Log-Step "Environment diagnostics saved" "OK"
} else {
  Log-Step "Environment diagnostics skipped" "SKIP"
}

End-Phase "Environment Diagnostics"

# ═══════════════════════════════════════════════════════════════════════
# PHASE 2: Process & Port Cleanup
# ═══════════════════════════════════════════════════════════════════════
Write-Header "Phase 2: Process & Port Cleanup"
Start-Phase "Process & Port Cleanup"

if (-not $SkipKill) {
  Start-Timer
  $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
  if ($nodeProcesses) {
    $count = ($nodeProcesses | Measure-Object).Count
    $pids = ($nodeProcesses | ForEach-Object { $_.Id }) -join ", "
    Log-Step "Found $count node.exe process(es) [PID: $pids]" "WARN"
    $nodeProcesses | ForEach-Object {
      try { $_.Kill() } catch {}
    }
    Start-Sleep -Seconds 2
    $remaining = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if (-not $remaining) {
      Log-Step "All node processes killed (took $(Stop-Timer))" "OK"
    } else {
      Log-Step "$(($remaining | Measure-Object).Count) node processes remain, force terminating..." "WARN"
      Get-CimInstance Win32_Process -Filter "Name='node.exe'" | ForEach-Object {
        try { $_.Terminate() } catch {}
      } 2>$null
      Start-Sleep -Seconds 2
      $finalRemaining = Get-Process -Name "node" -ErrorAction SilentlyContinue
      if ($finalRemaining) {
        Log-Step "$(($finalRemaining | Measure-Object).Count) node processes could not be killed" "WARN"
      } else {
        Log-Step "All node processes force terminated (took $(Stop-Timer))" "OK"
      }
    }
  } else {
    Log-Step "No stale node processes (took $(Stop-Timer))" "OK"
  }

  Start-Timer
  try {
    $portProcess = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($portProcess) {
      $owningProcess = Get-Process -Id $portProcess.OwningProcess -ErrorAction SilentlyContinue
      if ($owningProcess) {
        Log-Step "Port 3000 held by $($owningProcess.ProcessName) PID $($owningProcess.Id)" "WARN"
        $owningProcess.Kill()
        Start-Sleep -Seconds 2
      }
    }
    $stillHeld = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if (-not $stillHeld) {
      Log-Step "Port 3000 is free (took $(Stop-Timer))" "OK"
    } else {
      Log-Step "Port 3000 still in use after kill attempt" "WARN"
    }
  } catch {
    Log-Step "Port check requires admin rights: $_" "WARN"
  }

  Start-Timer
  $lockFiles = @(
    ".next\lock",
    "prisma\dev.db-journal",
    "prisma\dev.db-wal",
    "prisma\dev.db-shm"
  )
  $cleanedLocks = 0
  foreach ($file in $lockFiles) {
    $fullPath = Join-Path -Path $ProjectRoot -ChildPath $file
    if (Test-Path -LiteralPath $fullPath) {
      try { Remove-Item -LiteralPath $fullPath -Force -ErrorAction SilentlyContinue; $cleanedLocks++ } catch {}
    }
  }
  if ($cleanedLocks -gt 0) {
    Log-Step "Cleaned $cleanedLocks stale lockfiles (took $(Stop-Timer))" "OK"
  } else {
    Log-Step "No stale lockfiles (took $(Stop-Timer))" "OK"
  }
} else {
  Log-Step "Process cleanup skipped" "SKIP"
}

End-Phase "Process & Port Cleanup"

# ═══════════════════════════════════════════════════════════════════════
# PHASE 3: Environment Validation
# ═══════════════════════════════════════════════════════════════════════
Write-Header "Phase 3: Environment Validation"
Start-Phase "Environment Validation"

Start-Timer
$envFile = Join-Path -Path $ProjectRoot -ChildPath ".env"
if (-not (Test-Path -LiteralPath $envFile)) {
  $envExample = Join-Path -Path $ProjectRoot -ChildPath ".env.example"
  if (Test-Path -LiteralPath $envExample) {
    Copy-Item -Path $envExample -Destination $envFile
    Log-Step "Created .env from .env.example" "OK"
  } else {
    Log-Step "Missing .env and .env.example. Create .env manually." "FATAL"
    exit 1
  }
}

$envContent = Get-Content -Path $envFile -Raw
$requiredVars = @("DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL")
$missingVars = @()
foreach ($var in $requiredVars) {
  if ($envContent -notmatch "$var=") { $missingVars += $var }
}
if ($missingVars.Count -gt 0) {
  Log-Step "Missing env vars: $($missingVars -join ', ')" "FATAL"
  exit 1
}

if ($envContent -match "NEXTAUTH_URL=(.*)") {
  $authUrl = $matches[1].Trim()
  if ($authUrl -notmatch "^https?://") {
    Log-Step "NEXTAUTH_URL should start with http:// or https://" "WARN"
  }
  if ($authUrl -notmatch "^http://localhost") {
    Log-Step "NEXTAUTH_URL is not localhost: $authUrl" "WARN"
  }
}

Log-Step ".env validated (took $(Stop-Timer))" "OK"
End-Phase "Environment Validation"

# ═══════════════════════════════════════════════════════════════════════
# PHASE 4: Dependency Integrity
# ═══════════════════════════════════════════════════════════════════════
Write-Header "Phase 4: Dependency Integrity"
Start-Phase "Dependency Integrity"

Start-Timer
$prismaClientPath = Join-Path -Path $ProjectRoot -ChildPath "node_modules\@prisma\client"
$lockFilePath = Join-Path -Path $ProjectRoot -ChildPath "package-lock.json"
$nodeModulesExist = Test-Path -LiteralPath $prismaClientPath
$lockFileExists = Test-Path -LiteralPath $lockFilePath

if (-not $nodeModulesExist -or (-not $lockFileExists)) {
  Log-Step "Dependencies incomplete. Running npm install..." "WARN"
  if (-not $SkipInstall) {
    try {
      & npm install 2>&1 | Out-Null
      if (Test-Path -LiteralPath $prismaClientPath) {
        Log-Step "npm install succeeded (took $(Stop-Timer))" "OK"
      } else {
        Log-Step "npm install completed but @prisma/client missing" "WARN"
      }
    } catch {
      Log-Step "npm install failed: $_" "FATAL"
      exit 1
    }
  } else {
    Log-Step "npm install skipped but dependencies may be missing" "WARN"
  }
} else {
  Log-Step "Dependencies installed (took $(Stop-Timer))" "OK"
}
End-Phase "Dependency Integrity"

# ═══════════════════════════════════════════════════════════════════════
# PHASE 5: Cache Cleanup
# ═══════════════════════════════════════════════════════════════════════
Write-Header "Phase 5: Cache Cleanup"
Start-Phase "Cache Cleanup"

if (-not $SkipClean) {
  Start-Timer
  $dirsToClean = @(
    ".next",
    "out",
    "node_modules\.cache",
    ".cache"
  )
  $cleaned = 0
  $failedDirs = @()
  foreach ($dir in $dirsToClean) {
    $fullPath = Join-Path -Path $ProjectRoot -ChildPath $dir
    if (Test-Path -LiteralPath $fullPath) {
      try {
        Remove-Item -LiteralPath $fullPath -Recurse -Force -ErrorAction SilentlyContinue
        if (-not (Test-Path -LiteralPath $fullPath)) {
          $cleaned++
        } else {
          $failedDirs += $dir
        }
      } catch {
        $failedDirs += $dir
        Log-Step "Could not remove $($dir): $_" "WARN"
      }
    }
  }
  if ($cleaned -gt 0) {
    Log-Step "Cleaned $cleaned cache directories (took $(Stop-Timer))" "OK"
  } else {
    Log-Step "No cache to clean (took $(Stop-Timer))" "OK"
  }
  if ($failedDirs.Count -gt 0) {
    Log-Step "Some directories could not be fully cleaned: $($failedDirs -join ', ')" "WARN"
  }

  $tsBuildInfo = Join-Path -Path $ProjectRoot -ChildPath "tsconfig.tsbuildinfo"
  if (Test-Path -LiteralPath $tsBuildInfo) {
    try { Remove-Item -LiteralPath $tsBuildInfo -Force -ErrorAction SilentlyContinue } catch {}
  }
} else {
  Log-Step "Cache cleanup skipped" "SKIP"
}
End-Phase "Cache Cleanup"

# ═══════════════════════════════════════════════════════════════════════
# PHASE 6: Database Operations (schema-aware in FAST mode)
# ═══════════════════════════════════════════════════════════════════════
Write-Header "Phase 6: Database Operations"
Start-Phase "Database Operations"

if (-not $SkipDb) {
  $dbPhaseTimer = Get-Date

  $schemaPath = Join-Path -Path $ProjectRoot -ChildPath "prisma\schema.prisma"
  if (-not (Test-Path -LiteralPath $schemaPath)) {
    Log-Step "Missing prisma schema at $schemaPath" "FATAL"
    exit 1
  }

  $dbPath = Join-Path -Path $ProjectRoot -ChildPath "prisma\dev.db"
  if (-not (Test-Path -LiteralPath $dbPath)) {
    Log-Step "Database file missing - will create on push" "WARN"
  }

  # Check schema hash — skip DB ops if unchanged (smart cache)
  $schemaChanged = $false
  if ($Fast -or (-not $Heal)) {
    $checkResult = & node check-prisma.js 2>&1
    if ($LASTEXITCODE -eq 0) {
      Log-Step "Schema unchanged — skipping DB operations (use -Heal to force)" "OK"
      $SkipDb = $true  # Mark as skipped for timing purposes
    } else {
      $schemaChanged = $true
      Log-Step "Schema changed — running DB sync" "INFO"
    }
  }

  if (-not $SkipDb) {
    # Push schema with retry
    Start-Timer
    $pushOk = $false
    for ($attempt = 1; $attempt -le 3; $attempt++) {
      $pushResult = & npx.cmd prisma db push --accept-data-loss 2>&1
      if ($LASTEXITCODE -eq 0) {
        $pushOk = $true
        Log-Step "Database schema synced (took $(Stop-Timer))" "OK"
        break
      }
      if ($attempt -lt 3) {
        Log-Step "Schema push failed, retrying ($attempt/3)..." "WARN"
        & npx.cmd prisma generate 2>&1 | Out-Null
        Start-Sleep -Seconds 2
      }
    }
    if (-not $pushOk) {
      Log-Step "Database schema sync failed after 3 attempts" "ERROR"
    }

    # Generate Prisma client with retry
    Start-Timer
    $genOk = $false
    for ($attempt = 1; $attempt -le 3; $attempt++) {
      $genResult = & npx.cmd prisma generate 2>&1
      if ($LASTEXITCODE -eq 0) { $genOk = $true; break }
      Log-Step "Prisma generate attempt $attempt/3 failed" "WARN"
      Start-Sleep -Seconds 2
    }
    if ($genOk) {
      Log-Step "Prisma client generated (took $(Stop-Timer))" "OK"
      # Update schema hash cache
      & node check-prisma.js --update 2>&1 | Out-Null
    } else {
      Log-Step "Prisma generate failed after 3 attempts: $genResult" "ERROR"
    }

    # Seed database (idempotent — skips if already seeded)
    Start-Timer
    try {
      $seedResult = & npx.cmd tsx prisma/seed.ts 2>&1
      $lastLine = $seedResult | Select-Object -Last 1
      if ($lastLine -match "already seeded") {
        Log-Step "Database already seeded (took $(Stop-Timer))" "OK"
      } elseif ($lastLine -match "successfully") {
        Log-Step "Database seeded successfully (took $(Stop-Timer))" "OK"
      } else {
        Log-Step "$lastLine (took $(Stop-Timer))" "OK"
      }
    } catch {
      Log-Step "Seed check failed: $_" "WARN"
    }

    # Verify DB connectivity via Prisma
    Start-Timer
    $hcOk = $false
    for ($attempt = 1; $attempt -le 3; $attempt++) {
      $hcResult = & npx.cmd tsx -e "
        const { PrismaClient } = require('@prisma/client');
        const p = new PrismaClient();
        p.\$queryRaw\`SELECT 1\`
          .then(() => { console.log('DB_OK'); process.exit(0); })
          .catch((e) => { console.log('DB_FAIL:' + e.message); process.exit(1); })
          .finally(() => p.\$disconnect());
      " 2>&1
      if ($LASTEXITCODE -eq 0) {
        $hcOk = $true
        $dbLatency = $hcResult | Select-Object -Last 1
        Log-Step "Database connectivity verified (took $(Stop-Timer))" "OK"
        break
      }
      Log-Step "DB connectivity check attempt $attempt/3 failed" "WARN"
      Start-Sleep -Seconds 2
    }
    if (-not $hcOk) {
      Log-Step "Database connectivity check failed after 3 attempts" "WARN"
    }

    $dbElapsed = (Get-Date) - $dbPhaseTimer
    Log-Step "Database operations complete ($("{0:N1}s" -f $dbElapsed.TotalSeconds))" "OK"
  }
} else {
  Log-Step "Database operations skipped" "SKIP"
}
End-Phase "Database Operations"

# ═══════════════════════════════════════════════════════════════════════
# PHASE 7: Start Dev Server
# ═══════════════════════════════════════════════════════════════════════
Write-Header "Phase 7: Server Startup"
Start-Phase "Server Startup"

if (-not $SkipDev) {
  function Start-DevServer {
    Start-Timer
    Log-Step "Starting Next.js dev server (Webpack)..."

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "cmd.exe"
    $psi.Arguments = "/c npx.cmd next dev --webpack --port 3000"
    $psi.WorkingDirectory = $ProjectRoot
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.EnvironmentVariables["NODE_ENV"] = "development"
    $psi.EnvironmentVariables["NEXT_TELEMETRY_DISABLED"] = "1"
    $psi.EnvironmentVariables["NO_COLOR"] = "1"
    $psi.CreateNoWindow = $true

    $script:serverProcess = New-Object System.Diagnostics.Process
    $script:serverProcess.StartInfo = $psi
    $script:serverProcess.Start() | Out-Null

    [System.Threading.Thread]::Sleep(4000)

    Log-Step "Dev server started (PID: $($script:serverProcess.Id)) (took $(Stop-Timer))" "OK"
  }

  function Wait-ForServer {
    param([int]$TimeoutSeconds = 75)

    $maxRetries = [math]::Ceiling($TimeoutSeconds / 2)
    $retryCount = 0
    $serverReady = $false
    $healthData = $null

    while ($retryCount -lt $maxRetries -and -not $serverReady) {
      Start-Sleep -Seconds 2
      try {
        $resp = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) {
          $serverReady = $true
          try {
            $healthData = $resp.Content | ConvertFrom-Json
            $dbStatus = if ($healthData.database.status -eq "connected") { "connected" } else { "degraded($($healthData.database.status))" }
            $authOk = if ($healthData.auth.configured) { "configured" } else { "missing" }
            Log-Step "Server health: status=$($healthData.status), DB=$dbStatus, Auth=$authOk" "OK"
          } catch {
            Log-Step "Server responded at /api/health (but parse failed)" "OK"
          }
          break
        }
      } catch {
        try {
          $resp2 = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
          if ($resp2.StatusCode -ge 200 -and $resp2.StatusCode -lt 500) {
            $serverReady = $true
            Log-Step "Server responded at / (status $($resp2.StatusCode))" "OK"
            break
          }
        } catch {}
      }
      $retryCount++

      if ($retryCount -eq 10) {
        Log-Step "Server startup in progress (still waiting...) $(Stop-Timer)" "INFO"
      }

      if ($retryCount -eq 20) {
        Log-Step "Server startup taking longer than expected..." "WARN"
        $logPreview = Get-Content -Path $DevLog -ErrorAction SilentlyContinue | Select-Object -Last 5
        foreach ($line in $logPreview) { Log-Step "  $line" "INFO" }
      }
    }

    return @{ Ready = $serverReady; Health = $healthData }
  }

  function Monitor-Server {
    Log-Step "Continuous health monitoring active (every 15s)" "INFO"

    while ($true) {
      Start-Sleep -Seconds 15
      try {
        $null = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
      } catch {
        Log-Step "Health check failed" "WARN"
        Start-Sleep -Seconds 5
        try {
          $null = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        } catch {
          Log-Step "Server appears down" "ERROR"
          $crashTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
          Add-Content -Path $CrashLog -Value "[$crashTime] Server crash detected"

          if ($script:serverRestartCount -lt $script:maxServerRestarts) {
            $script:serverRestartCount++
            Log-Step "Auto-restarting server (attempt $($script:serverRestartCount)/$($script:maxServerRestarts))..." "WARN"

            if ($script:serverProcess -and -not $script:serverProcess.HasExited) {
              try { $script:serverProcess.Kill() } catch {}
              Start-Sleep -Seconds 2
            }

            try {
              $portProcess = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
              if ($portProcess) {
                $owningProcess = Get-Process -Id $portProcess.OwningProcess -ErrorAction SilentlyContinue
                if ($owningProcess) { try { $owningProcess.Kill() } catch {} }
                Start-Sleep -Seconds 3
              }
            } catch {}

            Start-DevServer
            $restoreResult = Wait-ForServer -TimeoutSeconds 45
            $restored = $restoreResult.Ready

            if ($restored) {
              Log-Step "Server auto-restored successfully" "OK"
            } else {
              Log-Step "Server auto-restore failed" "ERROR"
              Log-Step "Run '.\startup.ps1' to restart fresh" "ERROR"
              break
            }
          } else {
            Log-Step "Max restart attempts reached ($script:maxServerRestarts)" "ERROR"
            Log-Step "Run '.\startup.ps1' to restart fresh" "ERROR"
            break
          }
        }
      }
    }
  }

  # Start dev server
  Start-DevServer

  # Wait for server with timeout and health check
  $serverResult = Wait-ForServer -TimeoutSeconds 75
  $serverReady = $serverResult.Ready
  $healthData = $serverResult.Health

  $elapsedTotal = (Get-Date) - $scriptStartTime

  if ($serverReady) {
    $Host.UI.RawUI.ForegroundColor = "Green"
    if (-not $Quiet) {
      Write-Host ""
      Write-Host "  ╔════════════════════════════════════════════════════╗"
      Write-Host "  ║              SERVER IS RUNNING                    ║"
      Write-Host "  ╠════════════════════════════════════════════════════╣"
      Write-Host "  ║  Site:    http://localhost:3000                    ║"
      Write-Host "  ║  Admin:   http://localhost:3000/admin/login        ║"
      Write-Host "  ║  Health:  http://localhost:3000/api/health         ║"
      Write-Host "  ║  Login:   anirban / Admin@123                     ║"
      Write-Host "  ╠════════════════════════════════════════════════════╣"
      Write-Host "  ║  Startup: $("{0:N1}s" -f $elapsedTotal.TotalSeconds)                              ║"
      Write-Host "  ╚════════════════════════════════════════════════════╝"
      Write-Host ""
    }
    Log-Step "Server running at http://localhost:3000 (total: $("{0:N1}s" -f $elapsedTotal.TotalSeconds))" "OK"

    End-Phase "Server Startup"

    # Phase timing summary
    Write-Header "Startup Timing Summary"
    $phaseSummary = Get-PhaseSummary
    foreach ($p in $phaseSummary) {
      if (-not $Quiet) {
        Write-Host "  $($p.phase) ".PadRight(40, '.') -NoNewline -ForegroundColor DarkGray
        Write-Host " $($p.duration)" -ForegroundColor Gray
      }
    }

    # Summary
    if (-not $Quiet) {
      Write-Host ""
      Write-Host "  ── Summary ──" -ForegroundColor DarkCyan
      Write-Host "  Passed: $($Global:PassedSteps)  " -NoNewline -ForegroundColor Green
      Write-Host "Warnings: $($Global:WarnSteps)  " -NoNewline -ForegroundColor Yellow
      Write-Host "Failed: $($Global:FailedSteps)  " -NoNewline -ForegroundColor Red
      Write-Host "Skipped: $($Global:SkippedSteps)" -ForegroundColor DarkGray
      Write-Host ""
      Write-Host "  Press Ctrl+C to stop the server"
      Write-Host ""
    }

    # Continuous health monitoring (unless disabled)
    if (-not $NoMonitor) {
      Monitor-Server
    }
  } else {
    Log-Step "Server failed to start within timeout" "ERROR"
    if ($script:serverProcess -and -not $script:serverProcess.HasExited) {
      $script:serverProcess.Kill()
    }
    $logContent = Get-Content -Path $DevLog -ErrorAction SilentlyContinue | Select-Object -Last 30
    $errContent = Get-Content -Path $DevErrLog -ErrorAction SilentlyContinue | Select-Object -Last 30

    if ($logContent) {
      Log-Step "--- Last log output ---" "ERROR"
      foreach ($line in $logContent) { Log-Step "  $line" "ERROR" }
    }
    if ($errContent) {
      Log-Step "--- Last error output ---" "ERROR"
      foreach ($line in $errContent) { Log-Step "  $line" "ERROR" }
    }
    Log-Step "Server startup failed. Run '.\startup.ps1' for full diagnostic startup." "ERROR"
    exit 1
  }
} else {
  Log-Step "Dev server start skipped" "SKIP"
  End-Phase "Server Startup"
}

$elapsed = (Get-Date) - $scriptStartTime
Log-Step "Startup completed in $("{0:N1}s" -f $elapsed.TotalSeconds)" "OK"
