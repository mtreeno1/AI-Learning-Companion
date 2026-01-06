# Backend Dockerfile for AI Learning Companion
# Python FastAPI + YOLO Models

FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1-mesa-glx \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for models and recordings
RUN mkdir -p models recordings

# Download YOLO models if not present
RUN if [ ! -f models/yolov8n.pt ]; then \
    wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt -O models/yolov8n.pt; \
    fi && \
    if [ ! -f models/yolov8n-pose.pt ]; then \
    wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n-pose.pt -O models/yolov8n-pose.pt; \
    fi

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV RECORDINGS_PATH=/app/recordings

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/')" || exit 1

# Run the application
CMD ["python", "run.py"]
