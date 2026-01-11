# Docker Deployment Guide

> **📚 Alle Dokumentationen:** Siehe [Dokumentations-Index](INDEX.md)

Diese Seite bietet einen Überblick über die verschiedenen Docker-Deployment-Optionen der Einkaufsliste-Anwendung.

## 🚀 Quick Start

### Option 1: DockerHub Image (Empfohlen für Production)

```bash
# 1. .env Datei erstellen
cp .env.docker.example .env
nano .env  # SECRET_KEY und ADMIN_PASSWORD setzen

# 2. Container starten
docker-compose -f docker-compose.dockerhub.yml up -d

# 3. Browser öffnen
http://localhost:8000
```

➡️ **Details:** Siehe [docker-compose.dockerhub.yml](../docker-compose.dockerhub.yml)

### Option 2: Lokaler Build (Für Entwicklung)

```bash
# 1. .env Datei erstellen
cp .env.docker.example .env
nano .env

# 2. Build und Start
docker-compose up -d --build

# 3. Browser öffnen
http://localhost:8000
```

➡️ **Details:** Siehe [docker-compose.yml](../docker-compose.yml)

## 📖 Detaillierte Dokumentation

| Thema | Beschreibung | Link |
|-------|--------------|------|
| **Production Deployment** | DockerHub Image mit Watchtower Auto-Updates | [DOCKER_COMPOSE.md](DOCKER_COMPOSE.md) |
| **Development Build** | Lokaler Build für Entwickler | [DOCKER_BUILD.md](DOCKER_BUILD.md) |
| **DockerHub README** | Öffentliche Dokumentation auf DockerHub (EN) | [DOCKER_README.md](DOCKER_README.md) |

## 🔧 Environment Variablen

Alle Konfiguration erfolgt über `.env` Datei:

| Variable | Erforderlich | Beschreibung |
|----------|--------------|--------------|
| `DATABASE_URL` | Nein | Datenbank-Pfad (Standard: `sqlite:///./data/data.db`) |
| `SECRET_KEY` | **Ja** | JWT Secret - **NIEMALS Default-Wert verwenden!** |
| `ADMIN_USERNAME` | **Ja** | Initial Admin Username |
| `ADMIN_PASSWORD` | **Ja** | Initial Admin Password - **Sicheres Passwort!** |
| `ADMIN_EMAIL` | Nein | Admin E-Mail Adresse |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Nein | Token-Gültigkeit (Standard: 30) |
| `UNAPPROVED_USER_EXPIRY_HOURS` | Nein | Stunden bis User-Löschung (Standard: 48) |

**Sichere Secrets generieren:**
```bash
# SECRET_KEY
python -c "import secrets; print(secrets.token_hex(32))"

# ADMIN_PASSWORD
python -c "import secrets; print(secrets.token_urlsafe(16))"
```

## 📦 Volumes

- `/app/data` - SQLite Datenbank und User-Daten
  - **Wichtig:** Immer als Volume mounten für Datenpersistenz!
  - Mount: `-v ./data:/app/data` oder `./data:/app/data` in docker-compose

## 🏥 Health Check

Der Container hat einen integrierten Health Check:

```bash
# Status prüfen
docker inspect einkaufsliste-app --format='{{.State.Health.Status}}'

# Manueller Test
curl http://localhost:8000/api/version
```

## 🔒 Sicherheit

### Production Checklist

- ✅ **SECRET_KEY**: Zufälligen Wert generieren (siehe oben)
- ✅ **ADMIN_PASSWORD**: Starkes Passwort (min. 12 Zeichen)
- ✅ **.env Datei**: Niemals in Git committen (in `.gitignore`)
- ✅ **HTTPS**: Reverse Proxy mit SSL verwenden (z.B. Traefik)
- ✅ **Backups**: Regelmäßige Backups über `/backup` Page
- ✅ **Updates**: Watchtower für automatische Updates aktivieren

### .env Dateiberechtigungen

```bash
chmod 600 .env
```

## 🔄 Updates

### Mit Watchtower (Automatisch)

Watchtower prüft alle 6 Stunden auf neue Images:

```bash
# In docker-compose.dockerhub.yml bereits konfiguriert
docker-compose -f docker-compose.dockerhub.yml up -d
```

### Manuell

```bash
# DockerHub Image
docker pull lkaberlin/einkaufsliste:latest
docker-compose -f docker-compose.dockerhub.yml up -d

# Lokaler Build
docker-compose up -d --build
```

## 🛠️ Troubleshooting

### Container startet nicht

```bash
# Logs prüfen
docker-compose logs -f

# Container-Status
docker ps -a
```

### Datenbank-Fehler

```bash
# Datenbank prüfen
ls -lh ./data/data.db

# Berechtigungen setzen
chmod 666 ./data/data.db
```

### Port bereits belegt

```bash
# Port in docker-compose.yml ändern
ports:
  - "8080:8000"  # statt 8000:8000
```

## 📊 Monitoring

### Logs

```bash
# Alle Logs
docker-compose logs

# Live-Logs
docker-compose logs -f

# Nur App
docker logs einkaufsliste-app
```

### Container Status

```bash
docker-compose ps
```

## 🌐 Netzwerk

### Lokaler Zugriff

```
http://localhost:8000
```

### Netzwerk-Zugriff (andere Geräte)

```
http://<server-ip>:8000
```

**Firewall:** Port 8000 muss geöffnet sein.

### Mit Reverse Proxy (Empfohlen)

Beispiel mit Traefik in [DOCKER_COMPOSE.md](DOCKER_COMPOSE.md#traefik)

## 💾 Backup & Restore

### Via Web-UI (Empfohlen)

1. Browser: `http://localhost:8000/backup`
2. "Backup erstellen" klicken
3. Backup herunterladen
4. Für Restore: Backup hochladen und wiederherstellen

### Manuell

```bash
# Backup
docker cp einkaufsliste-app:/app/data/data.db ./backup-$(date +%Y%m%d).db

# Restore
docker-compose down
cp backup-20240115.db ./data/data.db
docker-compose up -d
```

## 📚 Weiterführende Dokumentation

- **[DOCKER_COMPOSE.md](DOCKER_COMPOSE.md)** - Production Setups mit docker-compose
- **[DOCKER_BUILD.md](DOCKER_BUILD.md)** - Build-Prozess und Development
- **[DOCKER_README.md](DOCKER_README.md)** - DockerHub Dokumentation (EN)
- **[ARCHITECTURE.md](client/ARCHITECTURE.md)** - Anwendungs-Architektur
- **[FEATURES.md](FEATURES.md)** - Feature-Übersicht

## 🆘 Support

Bei Problemen:
1. Prüfe die Logs: `docker-compose logs -f`
2. Checke [DOCKER_BUILD.md](DOCKER_BUILD.md#troubleshooting) für bekannte Probleme
3. Erstelle ein Issue auf GitHub mit Logs und Fehlermeldung
