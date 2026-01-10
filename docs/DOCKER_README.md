# Einkaufsliste - Shopping List Application

Multi-user shopping list with client-server architecture, weekly meal planning, and real-time synchronization.

## Quick Start

### Option 1: Docker Run with Environment Variables

```bash
docker run -d \
  -p 8000:8000 \
  -v einkaufsliste-data:/app/data \
  -e DATABASE_URL=sqlite:///./data/data.db \
  -e SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))") \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=changeme \
  -e ADMIN_EMAIL=admin@example.com \
  -e ACCESS_TOKEN_EXPIRE_MINUTES=30 \
  -e UNAPPROVED_USER_EXPIRY_HOURS=48 \
  --name einkaufsliste \
  einkaufsliste:latest
```

### Option 2: Docker Run with .env File (Recommended)

```bash
# 1. Create .env file from template
cp .env.docker.example .env

# 2. Edit .env with your values
nano .env

# 3. Run container with .env file
docker run -d \
  -p 8000:8000 \
  -v einkaufsliste-data:/app/data \
  --env-file .env \
  --name einkaufsliste \
  einkaufsliste:latest
```

### Option 3: Docker Compose (Best for Production)

See [Docker Compose Example](#docker-compose-example) below.

Access the application at: `http://localhost:8000`

## Features

- **Shopping List Management**: Create, edit, and manage shopping lists
- **Weekly Meal Planning**: Plan meals with automatic shopping list generation
- **Multi-User Support**: User authentication and authorization
- **Real-time Sync**: WebSocket-based live updates
- **Product Database**: Manage products with categories and stores
- **Templates**: Reusable shopping list templates
- **Backup/Restore**: Built-in data backup functionality
- **Print Support**: Optimized A4 landscape print layout (4 columns)

## Environment Variables

**All configuration must be passed at container runtime** via `-e` flags, `--env-file`, or docker-compose environment section.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No | `sqlite:///./data/data.db` | Database connection string |
| `SECRET_KEY` | **Yes** | None | JWT secret key - **MUST** set in production! Generate with: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ADMIN_USERNAME` | **Yes** | None | Initial admin username |
| `ADMIN_PASSWORD` | **Yes** | None | Initial admin password - **MUST** change in production! |
| `ADMIN_EMAIL` | No | `admin@example.com` | Admin email address |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `30` | JWT token expiration time (minutes) |
| `UNAPPROVED_USER_EXPIRY_HOURS` | No | `48` | Hours until unapproved users expire |
| `MAIN_SHOPPING_DAY` | No | `2` | Default shopping day (0=Mon, 6=Sun) |
| `FRESH_PRODUCTS_DAY` | No | `4` | Fresh products day (0=Mon, 6=Sun) |

**Security Warning**: Never use default/example values for `SECRET_KEY` and `ADMIN_PASSWORD` in production!

## Volumes

- `/app/data` - SQLite database and user data (recommended to mount as volume)

## Docker Compose Example

### Basic Setup with .env file

```yaml
# docker-compose.yml
services:
  einkaufsliste:
    image: einkaufsliste:latest
    container_name: einkaufsliste-app
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
    env_file:
      - .env  # All configuration from .env file
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/version')"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

**Setup Steps:**
```bash
# 1. Copy template
cp .env.docker.example .env

# 2. Edit .env file with your values
nano .env

# 3. Start container
docker-compose up -d
```

### Alternative: Inline Environment Variables

```yaml
services:
  einkaufsliste:
    image: einkaufsliste:latest
    container_name: einkaufsliste-app
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=sqlite:///./data/data.db
      - SECRET_KEY=${SECRET_KEY}  # Read from shell environment
      - ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}
      - ACCESS_TOKEN_EXPIRE_MINUTES=30
      - UNAPPROVED_USER_EXPIRY_HOURS=48
    restart: unless-stopped
```

## Production Deployment with Traefik

```yaml
# docker-compose.prod.yml
services:
  einkaufsliste:
    image: einkaufsliste:latest
    networks:
      - traefik
    volumes:
      - ./data:/app/data
    env_file:
      - .env  # All secrets from .env file
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.einkaufsliste.rule=Host(`shopping.example.com`)"
      - "traefik.http.routers.einkaufsliste.entrypoints=websecure"
      - "traefik.http.routers.einkaufsliste.tls.certresolver=letsencrypt"
      - "traefik.http.services.einkaufsliste.loadbalancer.server.port=8000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/version')"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s

networks:
  traefik:
    external: true
```

**Deployment:**
```bash
# Generate secure secrets
python -c "import secrets; print('SECRET_KEY=' + secrets.token_hex(32))" > .env
echo "ADMIN_USERNAME=admin" >> .env
echo "ADMIN_PASSWORD=$(python -c 'import secrets; print(secrets.token_urlsafe(16))')" >> .env
echo "ADMIN_EMAIL=admin@example.com" >> .env

# Start with production config
docker-compose -f docker-compose.prod.yml up -d
```

## Architecture

- **Backend**: Python FastAPI with SQLModel/SQLAlchemy
- **Frontend**: TypeScript Vanilla JS (4-layer architecture)
- **Database**: SQLite (easy backup/migration)
- **WebSocket**: Real-time updates for collaborative editing

## Health Check

The container includes a health check endpoint at `/api/version` that monitors application status.

## Security

**Important for Production:**

1. ✅ **Never hardcode secrets in docker-compose.yml**
   - Use `.env` file with `env_file:` directive
   - Or use Docker secrets for Swarm deployments
   - Ensure `.env` is in `.gitignore`

2. ✅ **Generate strong `SECRET_KEY`**
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

3. ✅ **Set secure `ADMIN_PASSWORD`**
   - Minimum 12 characters
   - Use password generator: `python -c "import secrets; print(secrets.token_urlsafe(16))"`

4. ✅ **Use HTTPS in production**
   - Recommended: Traefik with Let's Encrypt
   - Alternative: nginx reverse proxy with certbot

5. ✅ **Persistent data storage**
   - Mount `/app/data` as volume for database safety
   - Regular backups via built-in backup page

6. ✅ **File permissions**
   - Ensure `.env` has restricted permissions: `chmod 600 .env`

## Backup & Restore

Access the built-in backup management at `/backup` to:
- Create database backups
- Download backup files
- Restore from previous backups
- View backup history

**Recommended**: Create regular backups before updates!

## Links

- **GitHub**: [client_server_einkaufsliste](https://github.com/yourusername/client_server_einkaufsliste)
- **Documentation**: See `/docs` directory in repository
- **License**: See LICENSE file in repository

## Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Check existing documentation in `/docs`

---

Built with FastAPI, TypeScript, and ❤️
