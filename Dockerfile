# Multi-stage build for Client/Server Einkaufsliste
# Stage 1: Build Client (TypeScript compilation)
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copy package files first for better layer caching
COPY client/package*.json ./

# Install dependencies
RUN npm ci

# Copy all client files needed for build
COPY client/ ./

# Build TypeScript client
RUN npm run build

# Stage 2: Final Alpine image with Python server
FROM python:3.11-alpine

# Install system dependencies
RUN apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev \
    openssl-dev \
    cargo \
    rust

# Set working directory
WORKDIR /app

# Copy Python project files
COPY pyproject.toml README.md ./
COPY server/ ./server/

# Install Python dependencies
# Use --no-deps for setuptools_scm since we don't have .git in Docker
RUN pip install --no-cache-dir fastapi uvicorn[standard] sqlmodel python-jose[cryptography] bcrypt python-multipart python-readenv

# Copy built client from builder stage
COPY --from=client-builder /app/client/dist ./client/dist
COPY --from=client-builder /app/client/index.html ./client/index.html
COPY --from=client-builder /app/client/index-app.html ./client/index-app.html
COPY --from=client-builder /app/client/index-stores.html ./client/index-stores.html
COPY --from=client-builder /app/client/index-products.html ./client/index-products.html
COPY --from=client-builder /app/client/index-users.html ./client/index-users.html
COPY --from=client-builder /app/client/index-templates.html ./client/index-templates.html
COPY --from=client-builder /app/client/index-backup.html ./client/index-backup.html
COPY --from=client-builder /app/client/favicon.svg ./client/favicon.svg
COPY --from=client-builder /app/client/styles.css ./client/styles.css

# Copy page templates
COPY client/src/pages/*.html ./client/src/pages/

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 8000

# Set environment variables
# Only set system-level defaults, user config passed at runtime
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/version')"

# Run uvicorn server
CMD ["python", "-m", "uvicorn", "server.src.main:app", "--host", "0.0.0.0", "--port", "8000"]