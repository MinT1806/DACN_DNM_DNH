@echo off
REM Login and get token
curl -s -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}" > %TEMP%\login_resp.json

findstr /C:"token" %TEMP%\login_resp.json > %TEMP%\token_line.txt
for /f "tokens=3 delims=," %%a in (%TEMP%\token_line.txt) do set TOKEN=%%a
set TOKEN=%TOKEN:"=%
set TOKEN=%TOKEN: =%
echo Token obtained: %TOKEN%

REM Check admin stats
echo.
echo === ADMIN STATS ===
curl -s -X GET http://localhost:8080/api/admin/stats ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\stats.json
type %TEMP%\stats.json

REM Check users
echo.
echo === USERS (count) ===
curl -s -X GET "http://localhost:8080/api/admin/users?size=50" ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\users.json
findstr /C:"username" %TEMP%\users.json | find /C "username"

REM Check courses
echo.
echo === COURSES ===
curl -s -X GET http://localhost:8080/api/courses ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\courses.json
findstr /C:"title" %TEMP%\courses.json | find /C "title"

REM Check vocabulary total
echo.
echo === VOCABULARY ===
curl -s -X GET "http://localhost:8080/api/vocabulary?page=0&size=1" ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\vocab.json
type %TEMP%\vocab.json

REM Check daily challenges
echo.
echo === DAILY CHALLENGES ===
curl -s -X GET http://localhost:8080/api/daily-challenges ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\challenges.json
type %TEMP%\challenges.json

REM Check forum
echo.
echo === FORUM ===
curl -s -X GET "http://localhost:8080/api/forum/posts?page=0&size=5" ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\forum.json
type %TEMP%\forum.json

echo.
echo === VERIFICATION COMPLETE ===
