@echo off
REM start_weather_service.bat

REM call C:\path\to\venv\Scripts\activate.bat

echo Starting Weather microservice...
uvicorn weather_service:app --host 127.0.0.1 --port 8001

pause
