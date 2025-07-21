FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN addgroup --system app && adduser --system --group app

# Create directories for uploads and model cache
RUN mkdir -p uploads/originals uploads/thumbnails && \
    mkdir -p /app/models && \
    chown -R app:app uploads && \
    chown -R app:app /app/models

# Set environment variables for model cache
ENV TRANSFORMERS_CACHE=/app/models
ENV HF_HOME=/app/models

# Switch to non-root user
USER app

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3001"]