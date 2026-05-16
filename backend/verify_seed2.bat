@echo off
REM Login
curl -s -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}" > %TEMP%\login_resp.json

for /f "tokens=3 delims=," %%a in (%TEMP%\login_resp.json) do set TOKEN=%%a
set TOKEN=%TOKEN:"=%
set TOKEN=%TOKEN: =%
echo Token: OK

REM Check lessons
echo.
echo === LESSONS ===
curl -s -X GET "http://localhost:8080/api/lessons?page=0&size=3" ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\lessons.json
type %TEMP%\lessons.json

REM Check tests
echo.
echo === TESTS ===
curl -s -X GET "http://localhost:8080/api/tests" ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\tests.json
type %TEMP%\tests.json

REM Check stories
echo.
echo === STORIES ===
curl -s -X GET "http://localhost:8080/api/stories" ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\stories.json
type %TEMP%\stories.json

REM Check user progress
echo.
echo === USER PROGRESS ===
curl -s -X GET "http://localhost:8080/api/progress" ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\progress.json
type %TEMP%\progress.json

REM Check saved words
echo.
echo === SAVED WORDS ===
curl -s -X GET "http://localhost:8080/api/saved-words" ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\saved.json
type %TEMP%\saved.json

REM Check badges
echo.
echo === BADGES ===
curl -s -X GET "http://localhost:8080/api/badges" ^
  -H "Authorization: Bearer %TOKEN%" > %TEMP%\badges.json
type %TEMP%\badges.json

echo.
echo === DONE ===
