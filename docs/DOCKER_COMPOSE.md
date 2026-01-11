# Docker Compose Setups

> **📚 Zurück zu:** [Docker Deployment Guide](DOCKER.md) | [Dokumentations-Index](INDEX.md)

Diese Anleitung beschreibt verschiedene docker-compose Setups für unterschiedliche Deployment-Szenarien.

## 📋 Übersicht

| Setup | Verwendung | Datei |
|-------|------------|-------|
| **DockerHub + Watchtower** | Production (empfohlen) | [docker-compose.dockerhub.yml](../docker-compose.dockerhub.yml) |
| **Lokaler Build** | Development | [docker-compose.yml](../docker-compose.yml) |
| **Mit Traefik** | Production mit SSL | Siehe [Traefik Setup](#traefik-setup) |

## 🚀 Production Setup (DockerHub + Watchtower)

### Datei: `docker-compose.dockerhub.yml`

Verwendet das vorgefertigte Image von DockerHub mit automatischen Updates via Watchtower.

```yaml
services:
  einkaufsliste:
    image: lkaberlin/einkaufsliste:latest
    container_name: einkaufsliste-app
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/version')"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
    labels:
      - "com.centurylinklabs.watchtower.enable=true"

  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_POLL_INTERVAL=21600  # 6 hours
      - WATCHTOWER_LABEL_ENABLE=true
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_INCLUDE_STOPPED=true
    restart: unless-stopped
```

### Setup

```bash
# 1. .env erstellen
cp .env.docker.example .env
nano .env  # SECRET_KEY und ADMIN_PASSWORD setzen

# 2. Starten
docker-compose -f docker-compose.dockerhub.yml up -d

# 3. Logs prüfen
docker-compose -f docker-compose.dockerhub.yml logs -f

# 4. Status
docker-compose -f docker-compose.dockerhub.yml ps
```

### Watchtower Features

- ✅ Prüft alle 6 Stunden auf neue Images
- ✅ Zero-Downtime Updates
- ✅ Automatische Cleanup alter Images
- ✅ Nur Container mit Label werden aktualisiert
- ✅ Logs: `docker logs -f watchtower`

### Watchtower-Benachrichtigungen (Optional)

```yaml
  watchtower:
    # ... bestehende Config ...
    environment:
      # ... bestehende Variablen ...
      - WATCHTOWER_NOTIFICATIONS=shoutrrr
      - WATCHTOWER_NOTIFICATION_URL=telegram://token@telegram?chats=chat-id
      # Weitere Optionen: slack://, discord://, gotify://, etc.
```

## 🔧 Development Setup (Lokaler Build)

### Datei: `docker-compose.yml`

Baut das Image lokal aus dem Source Code.

```yaml
services:
  einkaufsliste:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: einkaufsliste-app
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/version')"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

### Setup

```bash
# 1. .env erstellen
cp .env.docker.example .env
nano .env

# 2. Build und Start
docker-compose up -d --build

# 3. Logs
docker-compose logs -f

# 4. Rebuild nach Code-Änderungen
docker-compose up -d --build
```

## 🌐 Traefik Setup

Production-Setup mit Traefik als Reverse Proxy für HTTPS/SSL.

### Datei: `docker-compose.traefik.yml`

```yaml
services:
  einkaufsliste:
    image: lkaberlin/einkaufsliste:latest
    container_name: einkaufsliste-app
    networks:
      - traefik
    volumes:
      - ./data:/app/data
    env_file:
      - .env
    restart: unless-stopped
    labels:
      # Traefik aktivieren
      - "traefik.enable=true"

      # HTTP Router
      - "traefik.http.routers.einkaufsliste.rule=Host(`shopping.example.com`)"
      - "traefik.http.routers.einkaufsliste.entrypoints=websecure"
      - "traefik.http.routers.einkaufsliste.tls=true"
      - "traefik.http.routers.einkaufsliste.tls.certresolver=letsencrypt"

      # Service
      - "traefik.http.services.einkaufsliste.loadbalancer.server.port=8000"

      # Watchtower
      - "com.centurylinklabs.watchtower.enable=true"

    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/version')"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s

  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_POLL_INTERVAL=21600
      - WATCHTOWER_LABEL_ENABLE=true
      - WATCHTOWER_CLEANUP=true
    restart: unless-stopped

networks:
  traefik:
    external: true
```

### Voraussetzungen

1. Traefik bereits installiert und konfiguriert
2. Traefik-Netzwerk existiert: `docker network create traefik`
3. DNS-Eintrag für Domain zeigt auf Server

### Setup

```bash
# 1. Domain in docker-compose.traefik.yml anpassen
# shopping.example.com → ihre-domain.de

# 2. .env erstellen
cp .env.docker.example .env
nano .env

# 3. Starten
docker-compose -f docker-compose.traefik.yml up -d

# 4. Zugriff über HTTPS
https://shopping.example.com
```

### Traefik Labels Erklärung

| Label | Beschreibung |
|-------|--------------|
| `traefik.enable=true` | Aktiviert Traefik für diesen Container |
| `traefik.http.routers.*.rule` | Domain-Regel für Routing |
| `traefik.http.routers.*.entrypoints` | HTTPS Endpoint |
| `traefik.http.routers.*.tls.certresolver` | Let's Encrypt Resolver |
| `traefik.http.services.*.loadbalancer.server.port` | Container-Port |

## 🔒 Production Best Practices

### Resource Limits

```yaml
services:
  einkaufsliste:
    # ... bestehende Config ...
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Logging

```yaml
services:
  einkaufsliste:
    # ... bestehende Config ...
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Network Isolation

```yaml
services:
  einkaufsliste:
    # ... bestehende Config ...
    networks:
      - backend

networks:
  backend:
    driver: bridge
    internal: false
```

## 🔄 Management Commands

### Alle Setups

```bash
# Starten
docker-compose -f <datei.yml> up -d

# Stoppen
docker-compose -f <datei.yml> down

# Logs
docker-compose -f <datei.yml> logs -f

# Status
docker-compose -f <datei.yml> ps

# Restart
docker-compose -f <datei.yml> restart

# Update (DockerHub)
docker-compose -f docker-compose.dockerhub.yml pull
docker-compose -f docker-compose.dockerhub.yml up -d

# Update (Lokaler Build)
docker-compose -f docker-compose.yml up -d --build
```

### Cleanup

```bash
# Container stoppen und entfernen
docker-compose -f <datei.yml> down

# Auch Volumes löschen (VORSICHT: Datenverlust!)
docker-compose -f <datei.yml> down -v

# Alte Images aufräumen
docker image prune -a
```

## 📊 Monitoring

### Health Status

```bash
# Via docker-compose
docker-compose -f <datei.yml> ps

# Via docker inspect
docker inspect einkaufsliste-app --format='{{.State.Health.Status}}'
```

### Resource Usage

```bash
# Live Stats
docker stats einkaufsliste-app

# Resource Verbrauch
docker-compose -f <datei.yml> top
```

## 🛠️ Troubleshooting

### Container startet nicht

```bash
# Logs prüfen
docker-compose -f <datei.yml> logs einkaufsliste

# Detaillierte Infos
docker inspect einkaufsliste-app
```

### Netzwerk-Probleme

```bash
# Netzwerke auflisten
docker network ls

# Traefik-Netzwerk erstellen (falls nicht vorhanden)
docker network create traefik

# Container im Netzwerk prüfen
docker network inspect traefik
```

### Watchtower funktioniert nicht

```bash
# Watchtower Logs
docker logs -f watchtower

# Manueller Test
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --run-once \
  einkaufsliste-app
```

## 📚 Weiterführende Links

- **[DOCKER.md](DOCKER.md)** - Docker Deployment Übersicht
- **[DOCKER_BUILD.md](DOCKER_BUILD.md)** - Build-Prozess & Development
- **[DOCKER_README.md](DOCKER_README.md)** - DockerHub Dokumentation
- **[Traefik Dokumentation](https://doc.traefik.io/traefik/)** - Offizielle Traefik Docs
- **[Watchtower Dokumentation](https://containrrr.dev/watchtower/)** - Offizielle Watchtower Docs

## 🆘 Support

Bei Problemen:
1. Logs prüfen: `docker-compose -f <datei.yml> logs -f`
2. Health Status: `docker-compose -f <datei.yml> ps`
3. Issue auf GitHub erstellen mit Logs und Setup-Details
