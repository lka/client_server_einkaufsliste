# Docker Deployment

Diese Anleitung beschreibt, wie Sie die Einkaufsliste-Anwendung mit Docker deployen.

## Voraussetzungen

- Docker 20.10+ installiert
- Docker Compose V2+ installiert
- (Optional) Git für Clone des Repositories

## Schnellstart mit Docker Compose (Empfohlen)

### 1. Environment-Variablen konfigurieren

```bash
# Kopieren Sie die Beispiel-Datei
cp .env.docker.example .env

# Generieren Sie einen sicheren SECRET_KEY
python -c "import secrets; print(secrets.token_hex(32))"

# Bearbeiten Sie .env und setzen Sie:
# - SECRET_KEY (der generierte Wert)
# - ADMIN_PASSWORD (ein sicheres Passwort)
```

**Wichtig**: Ändern Sie `SECRET_KEY` und `ADMIN_PASSWORD` vor dem produktiven Einsatz!

### 2. Container starten

```bash
# Build und Start
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Status prüfen
docker-compose ps
```

### 3. Anwendung öffnen

Öffnen Sie Ihren Browser und navigieren Sie zu:
- **http://localhost:8000** - Anwendung
- **http://localhost:8000/api/version** - Version-Endpoint (Healthcheck)

### 4. Admin-Login

Melden Sie sich mit den in `.env` konfigurierten Admin-Zugangsdaten an:
- **Benutzername**: Wert von `ADMIN_USERNAME` (Standard: `admin`)
- **Passwort**: Wert von `ADMIN_PASSWORD`

## Manuelle Docker-Nutzung (ohne Compose)

### Build

```bash
# Image bauen
docker build -t einkaufsliste:latest .

# Mit Build-Args (optional)
docker build \
  --build-arg PYTHON_VERSION=3.11 \
  -t einkaufsliste:latest .
```

### Run

```bash
# Container starten
docker run -d \
  --name einkaufsliste \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  -e SECRET_KEY="your-secret-key" \
  -e ADMIN_USERNAME="admin" \
  -e ADMIN_PASSWORD="your-password" \
  einkaufsliste:latest

# Logs anzeigen
docker logs -f einkaufsliste

# Container stoppen
docker stop einkaufsliste

# Container entfernen
docker rm einkaufsliste
```

## Multi-Stage Build

Das Dockerfile nutzt einen Multi-Stage Build:

1. **Stage 1 (client-builder)**: Node.js 20 Alpine
   - Installiert npm dependencies
   - Kompiliert TypeScript zu JavaScript
   - Baut den Client

2. **Stage 2 (final)**: Python 3.11 Alpine
   - Installiert Python dependencies
   - Kopiert den gebauten Client aus Stage 1
   - Startet den uvicorn Server

Vorteile:
- **Kleines Image**: Finales Image enthält nur Python + kompilierten Client (kein Node.js)
- **Schneller Build**: Nutzt Docker Layer Caching
- **Sicher**: Keine Build-Tools im finalen Image

## Persistenz & Volumes

### Datenbank-Persistenz

Die SQLite-Datenbank wird in einem Volume gespeichert:

```yaml
volumes:
  - ./data:/app/data
```

Dies stellt sicher, dass Daten bei Container-Neustarts erhalten bleiben.

### Backup der Datenbank

```bash
# Backup erstellen (über die Web-UI empfohlen)
# Oder manuell die Datei kopieren:
docker cp einkaufsliste:/app/data/data.db ./backup-$(date +%Y%m%d).db

# Restore (Container muss gestoppt sein)
docker-compose down
cp backup-20240115.db ./data/data.db
docker-compose up -d
```

**Empfohlen**: Nutzen Sie die Backup-Funktion in der Web-UI (`/backup`), da diese strukturunabhängig ist.

## Container-Management

### Starten/Stoppen

```bash
# Starten
docker-compose up -d

# Stoppen (Container behalten)
docker-compose stop

# Stoppen und entfernen
docker-compose down

# Stoppen, entfernen und Volumes löschen (VORSICHT: Datenverlust!)
docker-compose down -v
```

### Updates

```bash
# Neues Image bauen
docker-compose build

# Container neu starten mit neuem Image
docker-compose up -d

# Oder in einem Schritt
docker-compose up -d --build
```

### Logs

```bash
# Alle Logs
docker-compose logs

# Live-Logs (follow)
docker-compose logs -f

# Nur letzte 100 Zeilen
docker-compose logs --tail=100
```

## Umgebungsvariablen

| Variable | Beschreibung | Standard | Erforderlich |
|----------|--------------|----------|--------------|
| `SECRET_KEY` | JWT Secret Key | `dev-secret-key-change-in-production` | Ja (Produktion) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token-Gültigkeit (Minuten) | `30` | Nein |
| `DATABASE_URL` | Datenbank-URL | `sqlite:///./data/data.db` | Nein |
| `ADMIN_USERNAME` | Admin-Benutzername | `admin` | Ja |
| `ADMIN_PASSWORD` | Admin-Passwort | - | Ja |
| `ADMIN_EMAIL` | Admin-E-Mail | `admin@example.com` | Nein |
| `UNAPPROVED_USER_EXPIRY_HOURS` | Stunden bis User-Löschung | `48` | Nein |

## Healthcheck

Der Container enthält einen Healthcheck:

```yaml
healthcheck:
  test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/version')"]
  interval: 30s
  timeout: 3s
  retries: 3
  start_period: 5s
```

Status prüfen:

```bash
docker-compose ps
# oder
docker inspect einkaufsliste-app --format='{{.State.Health.Status}}'
```

## Netzwerk-Zugriff

### Lokaler Zugriff

```
http://localhost:8000
```

### Netzwerk-Zugriff (von anderen Geräten)

1. Container lauscht auf `0.0.0.0:8000`
2. Port-Mapping: `8000:8000` (Host:Container)
3. Zugriff über Server-IP:

```
http://<server-ip>:8000
```

**Firewall**: Stellen Sie sicher, dass Port 8000 in der Firewall erlaubt ist.

### Reverse Proxy (nginx/Traefik)

Für produktive Deployments empfiehlt sich ein Reverse Proxy mit HTTPS:

```nginx
# nginx Beispiel
server {
    listen 443 ssl;
    server_name einkaufsliste.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Image-Größe

Das fertige Alpine-basierte Image ist optimiert:

```bash
# Image-Größe prüfen
docker images einkaufsliste:latest

# Erwartete Größe: ~300-400 MB
# (Python 3.11 Alpine + Dependencies + Client)
```

## Troubleshooting

### Container startet nicht

```bash
# Logs prüfen
docker-compose logs

# Container-Status
docker-compose ps

# In Container einsteigen
docker-compose exec einkaufsliste sh
```

### Datenbank-Fehler

```bash
# Datenbank-Datei prüfen
ls -lh ./data/data.db

# Rechte prüfen (sollte beschreibbar sein)
chmod 666 ./data/data.db
```

### Port bereits belegt

```bash
# Port 8000 bereits in Verwendung?
# Ändere Port-Mapping in docker-compose.yml:
ports:
  - "8080:8000"  # Host:Container
```

### Build-Fehler

```bash
# Cache löschen und neu bauen
docker-compose build --no-cache

# Docker System aufräumen
docker system prune -a
```

### Healthcheck schlägt fehl

```bash
# Manuell testen
docker exec einkaufsliste-app python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/version')"

# Server-Logs prüfen
docker logs einkaufsliste-app
```

## Sicherheitshinweise

1. **SECRET_KEY**: Immer einen zufälligen, sicheren Wert verwenden
2. **ADMIN_PASSWORD**: Starkes Passwort setzen (min. 12 Zeichen)
3. **.env Datei**: Niemals in Git committen (bereits in `.gitignore`)
4. **HTTPS**: In Produktion immer HTTPS verwenden (Reverse Proxy)
5. **Updates**: Regelmäßig Base-Images aktualisieren
6. **Firewall**: Port 8000 nur für vertrauenswürdige Netzwerke öffnen

## Production Best Practices

1. **Secrets Management**: Nutzen Sie Docker Secrets oder externe Secrets-Manager
2. **Monitoring**: Integrieren Sie Logging (z.B. mit ELK Stack)
3. **Backups**: Automatisierte Backups der Datenbank einrichten
4. **Updates**: Automatische Updates mit Watchtower oder ähnlichen Tools
5. **Resource Limits**: Setzen Sie Memory/CPU-Limits in docker-compose.yml

```yaml
services:
  einkaufsliste:
    # ...
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## Zusammenfassung

**Quickstart:**
```bash
cp .env.docker.example .env
# Edit .env with secure values
docker-compose up -d
# Open http://localhost:8000
```

**Stop:**
```bash
docker-compose down
```

**Update:**
```bash
docker-compose up -d --build
```