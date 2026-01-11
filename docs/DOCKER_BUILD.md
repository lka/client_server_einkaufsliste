# Docker Build & Development

> **📚 Zurück zu:** [Docker Deployment Guide](DOCKER.md) | [Dokumentations-Index](INDEX.md)

Diese Anleitung beschreibt den Docker Build-Prozess und Development-Workflow.

## 🏗️ Multi-Stage Build

Das Dockerfile nutzt einen Multi-Stage Build für optimale Image-Größe und Build-Performance.

### Build-Stages

```dockerfile
# Stage 1: Client Builder (Node.js)
FROM node:20-alpine AS client-builder
# - Installiert npm dependencies
# - Kompiliert TypeScript zu JavaScript
# - Baut Client-Bundles

# Stage 2: Final Image (Python)
FROM python:3.11-alpine
# - Installiert Python dependencies
# - Kopiert gebauten Client aus Stage 1
# - Konfiguriert Server
```

### Vorteile

- ✅ **Kleines Image**: Finales Image enthält nur Python + kompilierten Client (kein Node.js)
- ✅ **Schneller Build**: Nutzt Docker Layer Caching effizient
- ✅ **Sicher**: Keine Build-Tools im finalen Image
- ✅ **Multi-Arch**: Baut für amd64 und arm64

## 🔨 Build Commands

### Lokaler Build

```bash
# Standard Build
docker build -t einkaufsliste:latest .

# Mit Build-Args
docker build \
  --build-arg PYTHON_VERSION=3.11 \
  -t einkaufsliste:v1.0.0 .

# Multi-Platform Build (mit buildx)
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t einkaufsliste:latest \
  --load \
  .
```

### Mit docker-compose

```bash
# Build und Start
docker-compose up -d --build

# Nur Build (ohne Start)
docker-compose build

# Ohne Cache (Fresh Build)
docker-compose build --no-cache
```

### Build mit GitHub Actions

Der automatische Build läuft bei jeder Release:

```yaml
# .github/workflows/auto-release.yml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    platforms: linux/amd64,linux/arm64
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

## 📁 Build Context

### Dateien im Build Context

```
.
├── Dockerfile              # Build-Anweisungen
├── pyproject.toml          # Python Dependencies
├── README.md               # Projekt-Dokumentation
├── client/
│   ├── package*.json       # Client Dependencies
│   ├── tsconfig.json       # TypeScript Config
│   ├── src/                # Client Source
│   └── dist/               # Build Output (wird erstellt)
└── server/
    └── src/                # Server Source
```

### .dockerignore

Optimiert den Build Context:

```
# Development
.git
.github
.vscode
*.md
docs/

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.pytest_cache/
.mypy_cache/
venv/
*.egg-info/

# Node
node_modules/
npm-debug.log
client/dist/

# Data
data/
*.db
*.db-journal
backups/

# Environment
.env
.env.local
```

## 🔍 Build-Prozess Details

### Stage 1: Client Build

```dockerfile
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# 1. Dependencies installieren (cached layer)
COPY client/package*.json ./
RUN npm ci

# 2. Source kopieren
COPY client/ ./

# 3. TypeScript kompilieren
RUN npm run build
```

**Output:**
- `client/dist/` - Kompilierte JavaScript Bundles
- HTML-Dateien bleiben unverändert

### Stage 2: Python Server

```dockerfile
FROM python:3.11-alpine

# 1. System Dependencies
RUN apk add --no-cache gcc musl-dev libffi-dev openssl-dev cargo rust

# 2. Python Dependencies
COPY pyproject.toml README.md ./
COPY server/ ./server/
RUN pip install --no-cache-dir fastapi uvicorn[standard] sqlmodel ...

# 3. Client kopieren (aus Stage 1)
COPY --from=client-builder /app/client/dist ./client/dist
COPY --from=client-builder /app/client/index*.html ./client/

# 4. Data Directory
RUN mkdir -p /app/data

# 5. Environment
ENV DATABASE_URL=sqlite:///./data/data.db
ENV PYTHONUNBUFFERED=1
```

## 🚀 Development Workflow

### 1. Code ändern

```bash
# Client-Code in client/src/
# Server-Code in server/src/
```

### 2. Rebuild & Restart

```bash
# Mit docker-compose
docker-compose up -d --build

# Oder manuell
docker build -t einkaufsliste:dev .
docker-compose up -d
```

### 3. Logs prüfen

```bash
docker-compose logs -f
```

### 4. In Container debuggen

```bash
# Shell im Container
docker-compose exec einkaufsliste sh

# Python-Code testen
docker-compose exec einkaufsliste python

# Dateien prüfen
docker-compose exec einkaufsliste ls -la /app/
```

## 🧪 Testing während Build

### Python Tests

Im Dockerfile integrieren (optional):

```dockerfile
# Nach pip install
RUN pip install pytest
COPY server/tests/ ./server/tests/
RUN pytest server/tests/
```

### Client Tests

```dockerfile
# In client-builder Stage
RUN npm test
```

**Empfehlung:** Tests in CI/CD (GitHub Actions) statt im Dockerfile.

## 📊 Image-Analyse

### Image-Größe prüfen

```bash
# Finales Image
docker images einkaufsliste:latest

# Layer-Größen
docker history einkaufsliste:latest

# Detaillierte Analyse
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  wagoodman/dive:latest \
  einkaufsliste:latest
```

### Erwartete Größe

- **Alpine Base**: ~50-70 MB
- **Python + Dependencies**: ~200-250 MB
- **Client Build**: ~10-20 MB
- **Gesamt**: ~300-400 MB (komprimiert)

## 🔧 Build-Optimierungen

### Layer Caching

```dockerfile
# RICHTIG: Dependencies zuerst (cached)
COPY package*.json ./
RUN npm ci
COPY src/ ./

# FALSCH: Alles auf einmal (cache miss bei jeder Änderung)
COPY . ./
RUN npm ci
```

### Multi-Stage für kleinere Images

```dockerfile
# Build-Dependencies nur in Builder-Stage
FROM builder AS builder
RUN npm install  # Große node_modules

FROM python:alpine
# Kopiere nur das Notwendige
COPY --from=builder /app/dist ./dist
```

### BuildKit Cache

```bash
# GitHub Actions nutzt automatisch
DOCKER_BUILDKIT=1 docker build .

# Mit Cache Mount (schnellere Builds)
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
```

## 🐛 Build Troubleshooting

### Build schlägt fehl: "npm ci failed"

```bash
# Package-lock.json neu generieren
cd client
rm package-lock.json
npm install
git add package-lock.json
git commit -m "fix: regenerate package-lock.json"

# Rebuild
docker-compose build --no-cache
```

### Build schlägt fehl: "pip install failed"

```bash
# Prüfe pyproject.toml Syntax
cd server
python -m pip install -e .

# Im Docker
docker-compose build --no-cache --progress=plain
```

### Build dauert zu lange

```bash
# .dockerignore prüfen
cat .dockerignore

# Build Context Größe
du -sh .

# Cache löschen
docker builder prune -a

# BuildKit aktivieren
export DOCKER_BUILDKIT=1
```

### "No space left on device"

```bash
# Docker aufräumen
docker system prune -a --volumes

# Build Cache löschen
docker builder prune -a

# Disk Space prüfen
df -h
```

## 🔐 Security Best Practices

### Non-Root User (Optional)

```dockerfile
# User erstellen
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser

# Ownership setzen
RUN chown -R appuser:appuser /app

# Als User ausführen
USER appuser
```

### Secrets nicht im Image

```dockerfile
# FALSCH: Secret im Image
ENV SECRET_KEY=my-secret-key

# RICHTIG: Zur Laufzeit übergeben
# docker run -e SECRET_KEY=xxx ...
```

### Minimale Base Image

```dockerfile
# Alpine statt Ubuntu/Debian
FROM python:3.11-alpine  # ~50 MB
# statt
FROM python:3.11         # ~900 MB
```

## 🏷️ Image Tags

### Versionierung

```bash
# Semantic Versioning
docker build -t einkaufsliste:1.2.3 .
docker build -t einkaufsliste:1.2 .
docker build -t einkaufsliste:1 .
docker build -t einkaufsliste:latest .

# Git-basiert
docker build -t einkaufsliste:$(git rev-parse --short HEAD) .
docker build -t einkaufsliste:$(git describe --tags) .
```

### Push zu Registry

```bash
# DockerHub
docker tag einkaufsliste:latest username/einkaufsliste:latest
docker push username/einkaufsliste:latest

# Multi-Tag Push
docker push username/einkaufsliste:1.2.3
docker push username/einkaufsliste:1.2
docker push username/einkaufsliste:latest
```

## 📚 Weiterführende Links

- **[DOCKER.md](DOCKER.md)** - Docker Deployment Übersicht
- **[DOCKER_COMPOSE.md](DOCKER_COMPOSE.md)** - Compose Setups
- **[Dockerfile](../Dockerfile)** - Aktuelles Dockerfile
- **[Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)** - Offizielle Docs
- **[Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)** - Docker Dokumentation

## 🆘 Support

Bei Build-Problemen:
1. Build mit `--progress=plain` für detaillierte Logs
2. `.dockerignore` prüfen
3. Cache löschen: `docker builder prune -a`
4. Issue auf GitHub mit Build-Logs erstellen
