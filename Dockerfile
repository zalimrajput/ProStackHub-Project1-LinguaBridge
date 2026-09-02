FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Set working directory to backend
WORKDIR /app/backend

# Expose the port
EXPOSE 8000

# Run the app with uvicorn
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
