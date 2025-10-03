@echo off
REM start_telegram_service.bat

REM call C:\path\to\venv\Scripts\activate.bat

echo Starting Telegram microservice...
uvicorn telegram_service:app --host 127.0.0.1 --port 8000

pause
