$procs = Get-Process java -ErrorAction SilentlyContinue
foreach ($p in $procs) {
    Write-Host "Killing PID: $($p.Id) - $($p.Path)"
    Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 3
Write-Host "All Java processes killed. Restarting backend..."
