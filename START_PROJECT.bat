@echo off
echo ====================================
echo   FinFusion V2 - Complete Setup
echo ====================================
echo.
echo Starting backend server (FastAPI)...
start "FinFusion Backend" cmd /k "cd backend && start.bat"
timeout /t 5 /nobreak > nul
echo.
echo Starting frontend server (React)...
start "FinFusion Frontend" cmd /k "cd frontend && npm start"
echo.
echo ====================================
echo   Both servers starting!
echo   Backend: http://localhost:8000
echo   Frontend: http://localhost:3000
echo ====================================
echo.
pause
