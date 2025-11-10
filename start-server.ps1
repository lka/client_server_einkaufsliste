# starte den uvicorn server von der root aus
venv\Scripts\python.exe -m uvicorn server.src.main:app --host 0.0.0.0 --port 8000
pause
