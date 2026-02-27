@echo off
echo Starting services...

start "Flask Backend" cmd /k "cd /d %~dp0server && call venv\Scripts\activate.bat && python app.py"

start "Vite Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo Both services starting...
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
