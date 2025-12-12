# WebSocket Debugging Guide

Dieses Dokument hilft bei der Diagnose von WebSocket-Verbindungsproblemen, insbesondere wenn Verbindungen vom iPad oder anderen Geräten im lokalen Netzwerk nicht funktionieren.

## Problem: iPad zeigt "verbinde..." aber keine Verbindung

### Ursachen

1. **Falsche IP-Adresse**: Das iPad versucht sich mit `window.location.host` zu verbinden, was auf sich selbst zeigt
2. **Windows Firewall**: Blockiert externe Verbindungen auf Port 8000
3. **Netzwerk-Problem**: iPad und PC sind nicht im gleichen Netzwerk

## Diagnose-Schritte

### Schritt 1: Netzwerk-Diagnose auf dem PC

Führe auf dem Windows-PC aus:

```powershell
.\diagnose-network.ps1
```

**Das Script zeigt:**
- ✅ Alle lokalen IP-Adressen des PCs (z.B. `192.168.178.32`)
- ✅ Ob Port 8000 auf `0.0.0.0` lauscht
- ✅ Windows Firewall-Status
- ✅ Ob der Server lokal antwortet
- ✅ Empfohlene URLs für das iPad

**Beispiel-Ausgabe:**
```
=== Network Diagnostics ===

1. Local IP Addresses:
   - 192.168.178.32 (WLAN)

2. Port 8000 Status:
   OK Port 8000 is LISTENING
   - Local Address: 0.0.0.0:8000

3. Windows Firewall Rules for Port 8000:
   - python.exe [Inbound] [Allow]

4. Connection URLs for iPad:
   http://192.168.178.32:8000
```

### Schritt 2: WebSocket Test-Tool verwenden

1. **JWT Token besorgen:**
   - Logge dich zuerst normal in die App ein: `http://192.168.178.32:8000`

2. **Auf dem iPad Safari:**
   - Navigiere zu `http://192.168.178.32:8000/websocket-debug.html` (verwende die IP aus Schritt 1)

3. **WebSocket testen:**
   - Token im Test-Tool einfügen
   - "WebSocket Verbinden" klicken
   - Log beobachten

**Erwartetes Ergebnis:**
- ✅ Status: "🟢 Verbunden"
- ✅ Log zeigt: "✅ WebSocket verbunden!"

**Bei Fehler:**
- ❌ Status: "🔴 Fehler"
- Log zeigt Details zum Problem (z.B. "Connection refused", "Timeout", etc.)

### Schritt 3: Browser Console prüfen

Auf dem iPad in Safari Web Inspector:

1. **Verbindungs-URL prüfen:**
   ```javascript
   // Nach dem Login und Aktivieren von WebSocket
   // Die Console sollte zeigen:
   // "WebSocket URL: ws://192.168.178.32:8000/ws/TOKEN_HIDDEN"
   // "Browser Info: { ... }"
   ```

2. **Manueller WebSocket-Test:**
   ```javascript
   const token = localStorage.getItem('token');
   const ws = new WebSocket(`ws://192.168.178.32:8000/ws/${token}`);
   ws.onopen = () => console.log('Connected!');
   ws.onerror = (e) => console.error('Error:', e);
   ws.onclose = (e) => console.log('Closed:', e.code, e.reason);
   ```

## Lösungen

### Lösung 1: Windows Firewall-Regel hinzufügen

Falls die Firewall externe Verbindungen blockiert:

```powershell
# Als Administrator ausführen
New-NetFirewallRule -DisplayName 'Einkaufsliste Port 8000' -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

### Lösung 2: Server neu starten mit expliziter IP

Falls der Server nicht auf allen Interfaces lauscht:

```powershell
.\start-server.ps1  # Verwendet bereits --host 0.0.0.0
```

### Lösung 3: Netzwerk-Verbindung prüfen

**Auf dem iPad:**
1. Settings → Wi-Fi → Netzwerkname tippen
2. IP-Adresse notieren (z.B. `192.168.178.45`)
3. Prüfen ob die ersten 3 Oktette mit dem PC übereinstimmen

**Ping-Test vom PC:**
```powershell
ping 192.168.178.45  # iPad IP-Adresse
```

### Lösung 4: Proxy/VPN deaktivieren

Falls ein VPN oder Proxy aktiv ist:
- Auf dem iPad: Settings → General → VPN & Device Management
- Temporär deaktivieren und erneut testen

## Häufige Fehler

### Fehler: "Connection refused"
**Ursache:** Server läuft nicht oder Firewall blockiert
**Lösung:**
- Server starten: `.\start-server.ps1`
- Firewall-Regel hinzufügen (siehe oben)

### Fehler: "Timeout"
**Ursache:** Netzwerk-Problem oder falsche IP
**Lösung:**
- IP-Adresse mit `.\diagnose-network.ps1` prüfen
- Ping-Test durchführen
- Gleiche Netzwerk-Segment prüfen

### Fehler: "401 Unauthorized"
**Ursache:** Ungültiges oder abgelaufenes JWT Token
**Lösung:**
- Neu einloggen und Token aktualisieren
- Token-Ablaufzeit prüfen (Standard: 7 Tage)

### Fehler: "WebSocket upgrade failed"
**Ursache:** Server unterstützt kein WebSocket-Upgrade
**Lösung:**
- Uvicorn läuft korrekt mit WebSocket-Support
- Proxy/Reverse-Proxy-Konfiguration prüfen

## Server-seitige Logs

Beim Verbindungsaufbau sollte der Server loggen:

```
INFO:     User 1 connected via WebSocket
```

Falls nicht, prüfe:
- Server-Console auf Fehler
- Authentifizierung (JWT Token gültig?)
- WebSocket-Endpoint in `server/src/main.py`

## Production: Nginx Reverse Proxy

Falls du Nginx als Reverse Proxy verwendest, stelle sicher dass WebSocket-Upgrade aktiviert ist:

```nginx
location /ws/ {
    proxy_pass http://localhost:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
}
```

## Zusammenfassung

**Checkliste für erfolgreiche WebSocket-Verbindung vom iPad:**

- [ ] Server läuft auf PC mit `--host 0.0.0.0`
- [ ] Port 8000 ist auf `0.0.0.0` listening
- [ ] Windows Firewall erlaubt Verbindungen auf Port 8000
- [ ] PC und iPad sind im gleichen Netzwerk
- [ ] Richtige IP-Adresse wird verwendet (nicht `localhost`)
- [ ] JWT Token ist gültig
- [ ] WebSocket-Feature-Flag ist aktiviert: `localStorage.setItem('enable_ws', 'true')`

**Tools:**
- `diagnose-network.ps1` - Netzwerk-Diagnose
- `test-websocket.html` - WebSocket-Verbindungstest
- Safari Web Inspector - Browser-Console-Logging
