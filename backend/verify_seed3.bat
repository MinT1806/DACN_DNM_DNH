@echo off
REM Login and properly extract token
curl -s -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}" > %TEMP%\login_resp.json

REM Extract token using PowerShell
powershell -Command "$j = Get-Content '%TEMP%\login_resp.json' | ConvertFrom-Json; $t = $j.token; Write-Host \"Token=$t\" | Out-File -FilePath '%TEMP%\token.txt' -Encoding ASCII"

set /p TOKEN=
set TOKEN=
<%TEMP%\token.txt
set TOKEN
echo Token=%TOKEN%

REM Check lessons (with proper auth)
echo.
echo === LESSONS ===
curl -s -X GET "http://localhost:8080/api/lessons?page=0&size=5" ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\lessons2.json
type %TEMP%\lessons2.json

REM Check tests
echo.
echo === TESTS (all) ===
curl -s -X GET "http://localhost:8080/api/tests" ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\tests2.json
type %TEMP%\tests2.json

REM Check stories
echo.
echo === STORIES ===
curl -s -X GET "http://localhost:8080/api/stories" ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\stories2.json
type %TEMP%\stories2.json

REM Check user progress
echo.
echo === USER PROGRESS ===
curl -s -X GET "http://localhost:8080/api/progress" ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\progress2.json
type %TEMP%\progress2.json

REM Check saved words
echo.
echo === SAVED WORDS ===
curl -s -X GET "http://localhost:8080/api/saved-words" ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\saved2.json
type %TEMP%\saved2.json

REM Check badges
echo.
echo === BADGES ===
curl -s -X GET "http://localhost:8080/api/badges" ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\badges2.json
type %TEMP%\badges2.json

REM Check stories via story controller
echo.
echo === STORY CONTROLLER ===
curl -s -X GET "http://localhost:8080/api/story" ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\storyctrl.json
type %TEMP%\storyctrl.json

echo.
echo === DONE ===
