@echo off
echo ========================================================
echo   Starting Medsei Hospital Discharge Platform Services
echo ========================================================

echo 1. Starting AI & Document OCR Service (FastAPI on Port 8000)...
start "Medsei AI Service (Port 8000)" cmd /k "cd /d e:\ricky_workspace\s\Medsei\ai-service && python main.py"

timeout /t 3 >nul

echo 2. Starting Main Clinical API Backend (Express on Port 5000)...
start "Medsei Backend API (Port 5000)" cmd /k "cd /d e:\ricky_workspace\s\Medsei\backend && npx tsx src/index.ts"

timeout /t 3 >nul

echo 3. Starting Frontend Web Portal (Vite on Port 3000)...
start "Medsei Frontend (Port 3000)" cmd /k "cd /d e:\ricky_workspace\s\Medsei\frontend && npm run dev -- --port 3000"

echo ========================================================
echo   All 3 services launched in separate windows!
echo   Frontend Web Portal: http://localhost:3000 (or 3001)
echo   Backend API:         http://localhost:5000/api/v1
echo   AI Microservice:     http://localhost:8000
echo ========================================================
pause

