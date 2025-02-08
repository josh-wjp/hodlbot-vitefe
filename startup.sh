#!/bin/bash

echo "🔹 Installing dependencies..."
pip install --no-cache-dir --upgrade pip
pip install --no-cache-dir -r requirements.txt

echo "🔹 Starting FastAPI server..."
exec uvicorn backend.main:app --host=0.0.0.0 --port=${PORT:-8000}
