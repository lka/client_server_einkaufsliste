# client_server_einkaufsliste

Python FastAPI Server + TypeScript Client with comprehensive test coverage.

## Project Structure

```
├── server/
│   ├── src/
│   │   ├── __init__.py       # Package initialization
│   │   ├── app.py            # Simple HTTP server (stdlib)
│   │   ├── main.py           # FastAPI application
│   │   ├── models.py         # SQLModel data models
│   │   └── db.py             # Database utilities
│   └── tests/
│       ├── conftest.py       # Pytest fixtures
│       └── test_api.py       # API integration tests
├── client/
│   ├── src/
│   │   ├── api.ts            # API client functions
│   │   ├── api.test.ts       # API tests
│   │   ├── dom.ts            # DOM utilities
│   │   ├── dom.test.ts       # DOM tests
│   │   ├── script.ts         # Application entry point
│   │   └── app.html          # HTML template
│   ├── dist/                 # Compiled JavaScript
│   ├── index.html            # Entry point
│   ├── styles.css            # Styles
│   ├── package.json          # Node dependencies
│   ├── tsconfig.json         # TypeScript config
│   └── jest.config.js        # Jest config
└── pyproject.toml            # Python project config
```

Voraussetzung: Python 3.10+

Installation & Entwicklung

1) Virtuelle Umgebung (empfohlen):

```powershell
python -m venv venv; .\venv\Scripts\Activate.ps1
```

2) Abhängigkeiten (inkl. Dev-Tools) installieren:

```powershell
pip install -e .[dev]
```

3) Client build (TypeScript):

```powershell
cd client
npm install
npm run build
cd ..
```

4) Server im Development-Modus starten (Uvicorn):

```powershell
uvicorn server.src.main:app --reload --port 8000
```

Dann im Browser öffnen: http://localhost:8000/

Hinweis: Die Implementierung verwendet einen in-memory store (nicht persistent). Für Produktion empfiehlt sich eine Datenbank und zusätzliche Robustheit (Auth, Fehler-Handling, Tests für Edge-Cases).

Formatting & Linting

- Formatieren mit Black:

```powershell
black server/
```

- Linting mit Flake8:

```powershell
flake8 server/
```

## Testing

### Server Tests (Python)

```powershell
pytest
# or with verbose output
pytest -v
```

### Client Tests (TypeScript/Jest)

```powershell
cd client
npm test
# or with coverage
npm run test:coverage
```
