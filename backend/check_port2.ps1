$conn = Test-NetConnection -ComputerName localhost -Port 8080 -WarningAction SilentlyContinue
if ($conn.TcpTestSucceeded) {
    Write-Host "Port 8080 is OPEN"
} else {
    Write-Host "Port 8080 is CLOSED"
}
