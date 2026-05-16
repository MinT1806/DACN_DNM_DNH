@echo off
REM Login
curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}" > %TEMP%\login3.json
powershell -Command "$j = Get-Content '%TEMP%\login3.json' | ConvertFrom-Json; $j.token" > %TEMP%\token3.txt
set /p TOKEN=<%TEMP%\token3.txt
echo Using token: %TOKEN:~0,40%...

echo === LESSONS ===
curl -s -X GET "http://localhost:8080/api/lessons?page=0&size=3" -H "Authorization: Bearer %TOKEN%" > %TEMP%\less3.txt
type %TEMP%\less3.txt

echo === STORIES ===
curl -s -X GET "http://localhost:8080/api/stories" -H "Authorization: Bearer %TOKEN%" > %TEMP%\story3.txt
type %TEMP%\story3.txt

echo === STORY CONTROLLER ===
curl -s -X GET "http://localhost:8080/api/story" -H "Authorization: Bearer %TOKEN%" > %TEMP%\storyc3.txt
type %TEMP%\storyc3.txt

echo === USER PROGRESS ===
curl -s -X GET "http://localhost:8080/api/progress" -H "Authorization: Bearer %TOKEN%" > %TEMP%\prog3.txt
type %TEMP%\prog3.txt

echo === DONE ===
