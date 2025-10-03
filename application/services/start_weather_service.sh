#!/bin/bash
# start_weather_service.sh

# source /path/to/venv/bin/activate

echo "Starting weather microservice..."
uvicorn weather_service:app --host 127.0.0.1 --port 8001
