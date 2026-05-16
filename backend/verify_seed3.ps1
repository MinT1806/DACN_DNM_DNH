$ErrorActionPreference = 'SilentlyContinue'

function Get-Token {
    $body = @{ username = "admin"; password = "admin123" } | ConvertTo-Json
    $resp = Invoke-WebRequest -Method Post -Uri "http://localhost:8080/api/auth/login" -ContentType "application/json" -Body $body -TimeoutSec 10
    $json = $resp.Content | ConvertFrom-Json
    return $json.token
}

$token = Get-Token
Write-Host "Token: $($token.Substring(0, [Math]::Min(50, $token.Length)))..."

$headers = @{ "Authorization" = "Bearer $token" }

# Lessons
Write-Host "`n=== LESSONS ===" -ForegroundColor Cyan
$r = Invoke-WebRequest -Method Get -Uri "http://localhost:8080/api/lessons?page=0&size=5" -Headers $headers -TimeoutSec 10
$j = $r.Content | ConvertFrom-Json
Write-Host "Total elements: $($j.totalElements)"
Write-Host "Content count: $($j.content.Count)"
if ($j.content.Count -gt 0) {
    $j.content | ForEach-Object { Write-Host "  - $($_.title) (Course $($_.courseId))" }
}

# Tests
Write-Host "`n=== TESTS ===" -ForegroundColor Cyan
$r = Invoke-WebRequest -Method Get -Uri "http://localhost:8080/api/tests" -Headers $headers -TimeoutSec 10
$j = $r.Content | ConvertFrom-Json
Write-Host "Count: $($j.Count)"
$j | ForEach-Object { Write-Host "  - $($_.title) ($($_.type))" }

# Stories
Write-Host "`n=== STORIES ===" -ForegroundColor Cyan
$r = Invoke-WebRequest -Method Get -Uri "http://localhost:8080/api/stories" -Headers $headers -TimeoutSec 10
$j = $r.Content | ConvertFrom-Json
Write-Host "Count: $($j.Count)"
$j | ForEach-Object { Write-Host "  - $($_.title)" }

# Story controller
Write-Host "`n=== STORY CONTROLLER ===" -ForegroundColor Cyan
$r = Invoke-WebRequest -Method Get -Uri "http://localhost:8080/api/story" -Headers $headers -TimeoutSec 10
Write-Host "Status: $($r.StatusCode), Length: $($r.Content.Length)"

# User Progress
Write-Host "`n=== USER PROGRESS ===" -ForegroundColor Cyan
$r = Invoke-WebRequest -Method Get -Uri "http://localhost:8080/api/progress" -Headers $headers -TimeoutSec 10
$j = $r.Content | ConvertFrom-Json
Write-Host "Count: $($j.Count)"
$j | ForEach-Object { Write-Host "  - User $($_.userId): Lesson $($_.lessonId), Completed=$($_.completed)" }

# Saved Words
Write-Host "`n=== SAVED WORDS ===" -ForegroundColor Cyan
$r = Invoke-WebRequest -Method Get -Uri "http://localhost:8080/api/saved-words" -Headers $headers -TimeoutSec 10
$j = $r.Content | ConvertFrom-Json
Write-Host "Count: $($j.Count)"

# Badges
Write-Host "`n=== BADGES ===" -ForegroundColor Cyan
$r = Invoke-WebRequest -Method Get -Uri "http://localhost:8080/api/badges" -Headers $headers -TimeoutSec 10
$j = $r.Content | ConvertFrom-Json
Write-Host "Count: $($j.Count)"
$j | ForEach-Object { Write-Host "  - $($_.name) ($($_.type))" }

Write-Host "`n=== DONE ===" -ForegroundColor Green
