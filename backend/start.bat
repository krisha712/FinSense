@echo off
echo ======================================
echo  Starting FinFusion Backend (FastAPI)
echo ======================================
cd /d "%~dp0"
call venv\Scripts\activate.bat
echo Virtual environment activated.
echo Starting Uvicorn server on http://localhost:8000...
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
