@echo off
echo Starting services...

set "BACKEND_CMD=cd /d %~dp0server && python app.py"
start "Flask Backend" cmd /k "%BACKEND_CMD%"

start "Vite Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo Both services starting...
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
