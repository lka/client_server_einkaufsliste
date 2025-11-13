# Prüfe, ob wir bereits im server Verzeichnis sind
$currentDir = Split-Path -Leaf (Get-Location)

if ($currentDir -eq "server") {
    # Bereits im server Verzeichnis
    ..\venv\Scripts\python.exe -m uvicorn src.main:app --host 0.0.0.0 --port 8000
} else {
    # Im root Verzeichnis, wechsle zu server
    Set-Location -Path server
    ..\venv\Scripts\python.exe -m uvicorn src.main:app --host 0.0.0.0 --port 8000
}
pause
