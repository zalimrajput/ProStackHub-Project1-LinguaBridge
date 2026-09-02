FROM python:3.11-slim

# Install system dependencies for sounddevice (camb-sdk)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libportaudio2 \
    portaudio19-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Set working directory to backend
WORKDIR /app/backend

# Expose the port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-8000}/api/health')" || exit 1

# Run the app
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
