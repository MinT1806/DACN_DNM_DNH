$procs = Get-Process java -ErrorAction SilentlyContinue
Write-Host "Java processes: $($procs.Count)"
if ($procs) {
    $procs | ForEach-Object { Write-Host "  PID: $($_.Id) - $($_.Path)" }
}
