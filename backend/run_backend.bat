@echo off
cd /d "%~dp0"
set DB_URL=jdbc:postgresql://YOUR_HOST:YOUR_PORT/YOUR_DB
set DB_USERNAME=your_username
set DB_PASSWORD=your_password
set GROQ_API_KEY=your_groq_api_key
set JWT_SECRET=your_jwt_secret
mvn spring-boot:run
