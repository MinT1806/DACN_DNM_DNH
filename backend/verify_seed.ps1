# Login and verify seeded data
$ErrorActionPreference = 'Continue'

# 1. Login as admin
Write-Host "=== 1. LOGIN ===" -ForegroundColor Cyan
$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$loginResp = Invoke-WebRequest -Method Post -Uri "http://localhost:8080/api/auth/login" `
    -ContentType "application/json" `
    -Body $body `
    -TimeoutSec 10

$loginJson = $loginResp.Content | ConvertFrom-Json
$token = $loginJson.token
Write-Host "Login: OK, Token: $($token.Substring(0, [Math]::Min(40, $token.Length)))..."

# 2. Check users
Write-Host "`n=== 2. USERS ===" -ForegroundColor Cyan
$users = Invoke-WebRequest -Method Get -Uri "http://localhost:8080/api/admin/users?size=50" `
    -Headers @{ "Authorization" = "Bearer $token" } `
    -TimeoutSec 10
$usersCount = ($users.Content | ConvertFrom-Json).Count
Write-Host "Users count: $usersCount"

# 3. Check courses
Write-Host "`n=== 3. COURSES ===" -ForegroundColor Cyan
$courses = Invoke-WebRequest -Method Get -Uri "http://localhost:8080/api/courses" `
    -Headers @{ "Authorization" = "Bearer $token" } `
    -TimeoutSec 10
$coursesCount = ($courses.Content | ConvertFrom-Json).Count
Write-Host "Courses count: $coursesCount"

# 4. Check vocabulary
Write-Host "`n=== 4. VOCABULARY ===" -ForegroundColor Cyan
$vocab = Invoke-WebRequest -Method Get -Uri "http://localhost:8080/api/vocabulary?page=0&size=1" `
    -Headers @{ "Authorization" = "Bearer $token" } `
    -TimeoutSec 10
$vocabJson = $vocab.Content | ConvertFrom-Json
Write-Host "Vocabulary total: $($vocabJson.totalElements)"

# 5. Check daily challenges
Write-Host "`n=== 5. DAILY CHALLENGES ===" -ForegroundColor Cyan
$challenges = Invoke-WebRequest -Method Get -Uri "http://localhost:8080/api/daily-challenges" `
    -Headers @{ "Authorization" = "Bearer $token" } `
    -TimeoutSec 10
Write-Host "Daily challenges status: $($challenges.StatusCode)"

# 6. Check forum posts
Write-Host "`n=== 6. FORUM POSTS ===" -ForegroundColor Cyan
$forum = Invoke-WebRequest -Method Get -Uri "http://localhost:8080/api/forum/posts?page=0&size=5" `
    -Headers @{ "Authorization" = "Bearer $token" } `
    -TimeoutSec 10
$forumJson = $forum.Content | ConvertFrom-Json
Write-Host "Forum posts (page 0): $($forumJson.content.Count)"

# 7. Check stats
Write-Host "`n=== 7. ADMIN STATS ===" -ForegroundColor Cyan
$stats = Invoke-WebRequest -Method Get -Uri "http://localhost:8080/api/admin/stats" `
    -Headers @{ "Authorization" = "Bearer $token" } `
    -TimeoutSec 10
$statsJson = $stats.Content | ConvertFrom-Json
Write-Host "Total Users: $($statsJson.totalUsers)"
Write-Host "Total Courses: $($statsJson.totalCourses)"
Write-Host "Total Vocabulary: $($statsJson.totalVocabulary)"

Write-Host "`n=== VERIFICATION COMPLETE ===" -ForegroundColor Green
