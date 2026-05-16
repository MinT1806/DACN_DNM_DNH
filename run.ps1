# ============================================================
# ABC English - Quick Start Script
# ============================================================
param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "status", "setup")]
    [string]$Action = "start"
)

$PROJECT_ROOT = $PSScriptRoot
$FRONTEND_DIR = Join-Path $PROJECT_ROOT "frontend"
$BACKEND_DIR = Join-Path $PROJECT_ROOT "backend"

$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$RED = "`e[31m"
$CYAN = "`e[36m"
$RESET = "`e[0m"

function Write-Step { param([string]$Msg); Write-Host "${CYAN}[>>>]${RESET} $Msg" }
function Write-Success { param([string]$Msg); Write-Host "${GREEN}[OK]${RESET} $Msg" }
function Write-Warn { param([string]$Msg); Write-Host "${YELLOW}[WARN]${RESET} $Msg" }
function Write-Fail { param([string]$Msg); Write-Host "${RED}[FAIL]${RESET} $Msg" }

# ============================================================
# CHECK PREREQUISITES
# ============================================================
function Check-Prerequisites {
    Write-Step "Checking prerequisites..."

    # Check Node.js
    $nodeVersion = node --version 2>$null
    if (-not $nodeVersion) {
        Write-Fail "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
        return $false
    }
    Write-Success "Node.js: $nodeVersion"

    # Check Maven
    $mvnVersion = mvn --version 2>$null
    if (-not $mvnVersion) {
        Write-Fail "Maven is not installed. Please install Maven from https://maven.apache.org"
        return $false
    }
    Write-Success "Maven: $(($mvnVersion -split "`n")[0])"

    # Check Java
    $javaVersion = java -version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Java is not installed. Please install Java 17+"
        return $false
    }
    Write-Success "Java: $(($javaVersion -split "`n")[0])"

    return $true
}

# ============================================================
# SETUP ENVIRONMENT
# ============================================================
function Setup-Environment {
    Write-Step "Setting up environment..."

    # Create .env for frontend
    $frontendEnvPath = Join-Path $FRONTEND_DIR ".env"
    $frontendEnvContent = @"
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_WS_URL=http://localhost:8080
"@
    if (-not (Test-Path $frontendEnvPath)) {
        Set-Content -Path $frontendEnvPath -Value $frontendEnvContent -Encoding UTF8
        Write-Success "Created $frontendEnvPath"
    } else {
        Write-Warn "$frontendEnvPath already exists, skipping..."
    }

    # Create .env for backend
    $backendEnvPath = Join-Path $BACKEND_DIR ".env"
    $backendEnvContent = @"
# Groq API Key - Get yours at https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# Database Configuration
DB_URL=jdbc:postgresql://localhost:5432/abcenglish
DB_USERNAME=postgres
DB_PASSWORD=your_password_here

# JWT Secret
JWT_SECRET=abcEnglishSecretKey2024VeryLongAndSecureKeyForJWTSigning

# Email Configuration (Optional)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=noreply@example.com
MAIL_PASSWORD=your_email_password
"@
    if (-not (Test-Path $backendEnvPath)) {
        Set-Content -Path $backendEnvPath -Value $backendEnvContent -Encoding UTF8
        Write-Success "Created $backendEnvPath"
    } else {
        Write-Warn "$backendEnvPath already exists, skipping..."
    }

    Write-Success "Environment setup complete!"
}

# ============================================================
# INSTALL DEPENDENCIES
# ============================================================
function Install-Dependencies {
    Write-Step "Installing dependencies..."

    # Install frontend dependencies
    Write-Step "Installing frontend dependencies..."
    Push-Location $FRONTEND_DIR
    try {
        npm install 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Frontend dependencies installed"
        } else {
            Write-Warn "Frontend dependencies installation may have issues"
        }
    } finally {
        Pop-Location
    }

    Write-Success "Dependencies installed!"
}

# ============================================================
# KILL SPECIFIC PORTS
# ============================================================
function Kill-Ports {
    Write-Step "Killing processes on ports 8080 and 3001..."

    $ports = @(8080, 3001)
    foreach ($port in $ports) {
        $pids = @()
        try {
            $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        } catch { }

        foreach ($processId in $pids) {
            if ($processId -and $processId -ne 0) {
                try {
                    $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    $name = if ($proc) { $proc.ProcessName } else { "PID $processId" }
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    Write-Success "  Killed $name (PID $processId) on port $port"
                } catch { }
            }
        }

        # Fallback via netstat
        $output = netstat -ano 2>$null | Select-String ":$port\s+.*LISTENING" -AllMatches
        foreach ($line in $output) {
            $parts = $line.Line -split '\s+'
            $processId = $parts[-1]
            if ($processId -and $processId -match '^\d+$') {
                try {
                    $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    $name = if ($proc) { $proc.ProcessName } else { "PID $processId" }
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    Write-Success "  Killed $name (PID $processId) on port $port"
                } catch { }
            }
        }
    }

    Start-Sleep -Seconds 1
}

# ============================================================
# STOP ALL
# ============================================================
function Stop-All {
    Write-Step "Stopping all services..."

    # Kill processes on port 8080 (Backend)
    Write-Host "  Killing processes on port 8080..."
    $backendPids = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $backendPids) {
        if ($pid -and $pid -ne 0) {
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Success "  Killed PID $pid (backend)"
            } catch { }
        }
    }

    # Kill processes on port 3001 (Frontend)
    Write-Host "  Killing processes on port 3001..."
    $frontendPids = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $frontendPids) {
        if ($pid -and $pid -ne 0) {
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Success "  Killed PID $pid (frontend)"
            } catch { }
        }
    }

    # Also try netstat fallback for compatibility
    Write-Host "  Scanning with netstat..."
    $netstatOutput = netstat -ano 2>$null
    if ($netstatOutput) {
        $allPorts = @(8080, 3001)
        foreach ($port in $allPorts) {
            $matches = $netstatOutput | Select-String ":$port\s+.*LISTENING" -AllMatches
            foreach ($match in $matches) {
                $parts = $match.Line -split '\s+'
                $pid = $parts[-1]
                if ($pid -and $pid -match '^\d+$') {
                    try {
                        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                        Write-Success "  Killed PID $pid (port $port)"
                    } catch { }
                }
            }
        }
    }

    # Kill Node.js and Java processes that might be running the servers
    Get-Process -Name "node","npm","java" -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine
            if ($cmd -match "spring-boot|javaw|react-scripts|npm.*start") {
                Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
                Write-Success "  Killed $($_.ProcessName) PID $($_.Id)"
            }
        } catch { }
    }

    Start-Sleep -Seconds 2
    Write-Success "All services stopped."
}

# ============================================================
# CHECK STATUS
# ============================================================
function Show-Status {
    $fe = netstat -ano | Select-String ":3001.*LISTENING"
    $be = netstat -ano | Select-String ":8080.*LISTENING"

    Write-Host ""
    if ($fe) { Write-Success "Frontend (port 3001): RUNNING" }
    else { Write-Warn "Frontend (port 3001): STOPPED" }

    if ($be) { Write-Success "Backend (port 8080): RUNNING" }
    else { Write-Warn "Backend (port 8080): STOPPED" }
    Write-Host ""
}

# ============================================================
# LOAD ENV FROM FILE
# ============================================================
function Load-EnvFile {
    $envFile = Join-Path $BACKEND_DIR ".env"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match "^([^=]+)=(.*)$") {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
        Write-Success "Loaded environment from .env file"
    }
}

# ============================================================
# START BACKEND
# ============================================================
function Start-Backend {
    Write-Step "Starting Backend (Spring Boot)..."
    Write-Host "  -> http://localhost:8080/api"
    Write-Host "  -> Health check: http://localhost:8080/api/health"
    Write-Host ""

    # Load environment variables from .env file
    Load-EnvFile

    # Read .env and prepare environment block for Start-Process
    $envBlock = @{}
    $envFile = Join-Path $BACKEND_DIR ".env"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match "^([^=]+)=(.*)$" -and -not $_.StartsWith("#")) {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                $envBlock[$key] = $value
            }
        }
    }

    # Build command with env vars
    $envVars = ($envBlock.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "; "
    $runCommand = "cd '$BACKEND_DIR'; $envVars; mvn spring-boot:run"

    Write-Host "  Loading GROQ_API_KEY from .env..."
    if ($envBlock.ContainsKey("GROQ_API_KEY")) {
        Write-Success "  GROQ_API_KEY: $($envBlock['GROQ_API_KEY'].Substring(0, [Math]::Min(10, $envBlock['GROQ_API_KEY'].Length)))..."
    }

    $backendProcess = Start-Process powershell -WorkingDirectory $BACKEND_DIR -ArgumentList `
        "-NoExit", "-Command", $runCommand `
        -PassThru -WindowStyle Normal

    Write-Step "Waiting for backend to start..."
    $maxWait = 90
    $waited = 0
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 3
        $running = netstat -ano | Select-String ":8080.*LISTENING"
        if ($running) {
            Write-Success "Backend is ready!"
            return $true
        }
        $waited += 3
        Write-Host "  Waiting... ($waited/$maxWait seconds)"
    }

    Write-Warn "Backend may still be starting. Check the backend window."
    return $false
}

# ============================================================
# START FRONTEND
# ============================================================
function Start-Frontend {
    Write-Step "Starting Frontend (React)..."
    Write-Host "  -> http://localhost:3001"
    Write-Host ""

    $frontendProcess = Start-Process powershell -WorkingDirectory $FRONTEND_DIR -ArgumentList `
        "-NoExit", "-Command", `
        "cd '$FRONTEND_DIR'; npm start" `
        -PassThru -WindowStyle Normal

    Write-Step "Waiting for frontend to start..."
    Start-Sleep -Seconds 10

    $running = netstat -ano | Select-String ":3001.*LISTENING"
    if ($running) {
        Write-Success "Frontend is ready!"
    } else {
        Write-Warn "Frontend may still be starting. Check the frontend window."
    }
}

# ============================================================
# START ALL
# ============================================================
function Start-All {
    Write-Host ""
    Write-Host "=============================================="
    Write-Host "  ABC English - Starting Services"
    Write-Host "=============================================="
    Write-Host ""

    # Check prerequisites
    if (-not (Check-Prerequisites)) {
        Write-Host ""
        Write-Fail "Prerequisites check failed. Please install required software."
        return
    }

    # Setup environment
    Setup-Environment

    # Install dependencies if needed
    if (-not (Test-Path (Join-Path $FRONTEND_DIR "node_modules"))) {
        Install-Dependencies
    }

    # Stop any existing processes - KILL PORTS FIRST
    Kill-Ports

    # Start Backend
    $backendReady = Start-Backend

    # Start Frontend
    Start-Frontend

    Write-Host ""
    Write-Host "=============================================="
    Write-Success "All services started!"
    Write-Host "=============================================="
    Write-Host ""
    Write-Host "  - Frontend: http://localhost:3001"
    Write-Host "  - Backend:  http://localhost:8080/api"
    Write-Host ""
    Write-Host "Open http://localhost:3001 in your browser"
    Write-Host ""
    Write-Host "Press Ctrl+C in each window to stop services"
    Write-Host ""

    Show-Status
}

# ============================================================
# MAIN
# ============================================================
switch ($Action) {
    "start"  { Start-All }
    "stop"   { Stop-All }
    "status" { Show-Status }
    "setup"  {
        if (-not (Check-Prerequisites)) { return }
        Setup-Environment
        Install-Dependencies
    }
    default  {
        Write-Host ""
        Write-Host "Usage: .\run.ps1 [action]"
        Write-Host ""
        Write-Host "  start  - Start all services (default)"
        Write-Host "  stop   - Stop all services"
        Write-Host "  status - Check service status"
        Write-Host "  setup  - Setup environment and install dependencies"
        Write-Host ""
    }
}
