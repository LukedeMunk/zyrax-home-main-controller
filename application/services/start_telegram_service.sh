#!/bin/bash
# start_telegram_service.sh

# source /path/to/venv/bin/activate

echo "Starting Telegram microservice..."
uvicorn telegram_service:app --host 127.0.0.1 --port 8000
