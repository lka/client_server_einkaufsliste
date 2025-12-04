# Client/Server Einkaufsliste

Eine moderne Shopping-List-Anwendung mit sicherer Benutzerauthentifizierung, persistenter Datenspeicherung, Mengenangaben und vollständig getesteter API.

Python FastAPI Server + TypeScript Client mit JWT-Authentifizierung.

## Release

- Release 3.0.0: Rezept-Integration - WebDAV-Import, Rezeptsuche und automatische Einkaufslisten-Generierung
 - Release 2.3.0: Personenanzahl in Vorlagen konfigurierbar + automatische Integration im Wochenplan
 - Release 2.2.0: Personenanzahl-Anpassung im Wochenplan-Modal + Shopping-Day-Bugfix
 - Release 2.1.0: Template-Items mit Mengenanpassung
 - Release 2.0.0: Wochenplaneinträge zeigen einen Preview
 - Release 1.5.0: WebSocket-Notifications hinzugefügt
 - Release 1.4.0: Wochenplaner integriert
 - Release 1.0.0: Erste stabile Version

## Features

- ✅ **JWT-Authentifizierung**: Sichere Benutzerauthentifizierung mit automatischem Token-Refresh und Inaktivitäts-Logout
  - **Automatisches Inaktivitäts-Logout**: Benutzer werden nach Ablauf der Token-Gültigkeit bei Inaktivität automatisch abgemeldet
    - Aktivitäts-Tracking durch Maus, Tastatur, Scroll und Touch-Events
    - Timer wird bei jeder Benutzeraktivität zurückgesetzt
    - Konfigurierbar über `ACCESS_TOKEN_EXPIRE_MINUTES` (Standard: 30 Minuten)
    - Alert-Benachrichtigung vor Weiterleitung zur Login-Seite
    - Automatisches Löschen von SessionStorage und Browser-History beim Logout
  - **Token-Expiry-Information**: Server sendet `expires_in` (Sekunden) bei Login-Response
  - **Sicheres Logout**: Löscht Token, SessionStorage und Browser-History
- ✅ **Multi-Store-Management**: Organisation nach Geschäften und Abteilungen
  - 3 vorkonfigurierte Geschäfte: Rewe, Edeka, Kaufland
  - Je 9 Abteilungen pro Geschäft (z.B. "Obst & Gemüse", "Backwaren", "Milchprodukte")
  - Produktkatalog mit über 17 gängigen Produkten
  - Zuordnung von Produkten zu Geschäften und Abteilungen
  - **Intelligente Produktvorschläge (Autocomplete)**: Dynamische Vorschläge beim Eingeben von Produktnamen
    - Echtzeit-Suche mit Fuzzy-Matching in der Produktdatenbank des ausgewählten Geschäfts
    - **Berücksichtigt drei Quellen** für umfassende Vorschläge:
      - **Produkte**: Alle Produkte im ausgewählten Geschäft
      - **Vorlagen-Namen**: Namen aller Shopping-Vorlagen (z.B. "Wocheneinkauf")
      - **Vorlagen-Items**: Einzelne Artikel aus allen Vorlagen
    - Duplikat-Vermeidung: Jeder Name erscheint nur einmal in den Vorschlägen
    - Vorschläge erscheinen ab 2 Zeichen mit 300ms Debouncing für optimale Performance
    - Bis zu 10 relevante Vorschläge, sortiert nach Ähnlichkeit
    - **Tastaturnavigation**: ↑↓ zum Navigieren, Enter zum Auswählen, Escape zum Schließen
    - **Mausunterstützung**: Klick oder Hover zum Auswählen
    - Automatischer Fokus auf Mengenfeld nach Auswahl für schnellen Workflow
    - Vorschläge können durch Weitertippen ignoriert werden
  - **Automatische Produkt-Zuordnung**: Neue Items werden automatisch mit Produkten im Katalog gematcht (Fuzzy-Matching mit 60% Schwellwert)
    - **Store-Boundary-Schutz**: Items bleiben beim ausgewählten Geschäft, auch wenn Produkt nur in anderem Geschäft existiert
    - **Sonstiges-Fallback**: Items ohne Produktmatch im ausgewählten Geschäft erscheinen unter "Sonstiges"
    - **Keine Store-übergreifenden Merges**: Fuzzy-Matching berücksichtigt store_id - Items verschiedener Geschäfte werden nicht zusammengeführt
  - **Abteilungs-Gruppierung**: Shopping-Liste zeigt Items gruppiert nach Abteilungen in Spalten-Layout
    - **"Sonstiges" an erster Stelle**: Nicht zugeordnete Items werden in der Ansicht ganz oben angezeigt
    - In Druckvorschau und Ausdruck bleibt die normale Abteilungssortierung erhalten
  - **Erstes Geschäft als Standard**: Automatische Auswahl des ersten Geschäfts beim Laden
  - **Automatische Bereinigung alter Daten**: Beim Serverstart werden veraltete Daten automatisch gelöscht
    - **Nicht freigeschaltete Benutzer**: Benutzer, die nie vom Admin freigegeben wurden
    - **Alte Einkaufslisten-Einträge**: Items deren `shopping_date` älter ist als die konfigurierte Zeitspanne
    - Konfigurierbar über `UNAPPROVED_USER_EXPIRY_HOURS` in `.env` (Standard: 48 Stunden)
    - Items ohne `shopping_date` werden NICHT gelöscht (für persistente Listen)
  - **Items vor Datum löschen**: Alle Items mit Einkaufsdatum vor einem gewählten Datum manuell löschen
    - DatePicker zur Datumsauswahl
    - Optional gefiltert nach ausgewähltem Geschäft
    - Mit Sicherheitsabfrage und Vorschau der betroffenen Items
  - **Produktkatalog erweitern**: Items aus "Sonstiges" per ✏️-Icon einer Abteilung zuweisen
    - Erstellt automatisch ein Produkt im Katalog (ohne Mengenangaben)
    - Item erscheint danach in der gewählten Abteilung statt in "Sonstiges"
    - Nutzt vorhandene Produkte, falls gleichnamiges Produkt bereits existiert
    - **Datumsübergreifende Zuordnung**: Wenn ein Item einer Abteilung zugeordnet wird, erhalten automatisch **alle Items mit dem gleichen Namen** (unabhängig vom Einkaufsdatum) die gleiche Abteilungszuordnung
  - **Automatische Item-Aktualisierung bei Produkt-Erstellung**: Wenn ein neues Produkt erstellt wird, werden automatisch alle bestehenden Einkaufslisten-Items aktualisiert
    - **Case-insensitive Matching**: Produktname wird unabhängig von Groß-/Kleinschreibung mit Item-Namen verglichen
    - **Automatische Verknüpfung**: Alle Items im gleichen Geschäft mit übereinstimmendem Namen werden mit dem neuen Produkt verknüpft
    - **Namens-Normalisierung**: Item-Namen werden auf den Produktnamen normalisiert
    - **WebSocket Broadcasting**: Alle aktualisierten Items werden live an verbundene Clients gesendet
    - Beispiel: Erstelle Produkt "Banane" → alle Items "BANANE", "banane", "Banane" werden verknüpft und erscheinen in der richtigen Abteilung
      - Einmalige Zuordnung genügt für alle zukünftigen und vergangenen Items mit dem gleichen Namen
      - Verhindert wiederholte manuelle Zuordnung bei wiederkehrenden Einkäufen
  - **Intelligente Druckfunktion**: Einkaufsliste als DIN A5-Heft drucken
    - Druckt auf DIN A4 Querformat → in der Mitte falten ergibt A5-Heft
    - **Plattform-spezifisches Drucken**: Optimiert für verschiedene Geräte
      - **Desktop (Windows/Mac)**: Popup-Fenster mit Druckvorschau
      - **iPad/iOS**: Popup-Fenster mit nativer Druckfunktion
      - **Android-Tablets**: Inline-Drucken (ersetzt temporär Seiteninhalt)
        - **Robuste Android-Erkennung**: Funktioniert auch im "Desktopwebsite"-Modus von Chrome
          - Multi-Method Detection: userAgent, userAgentData, platform, touch+mobile heuristic
          - Zuverlässige Erkennung auch bei aktiviertem Desktop-Modus
        - **Ein-Seiten-Layout**: Items links, Notizen rechts (wie auf iPad)
        - Verhindert Hängenbleiben des Druckdialogs auf Android
        - **Debug-Modus**: Optional aktivierbar durch `DEBUG = true` Flag
          - Dynamisches Laden von Debug-Console nur bei Bedarf
          - Separate Modul `print-debug.ts` für Debug-Funktionen
          - Produktions-Build ohne Debug-Overhead
    - **Datumsbasierte Filterung**: Dropdown zur Auswahl des Einkaufsdatums in der Druckvorschau
      - Zeigt alle verfügbaren Shopping-Daten
      - Default: Kleinstes (frühestes) Datum
      - "Alle Daten" Option für vollständige Liste
      - Im Ausdruck wird das ausgewählte Datum statisch angezeigt
    - **2-spaltige Darstellung**: Items werden in 2 Spalten angeordnet für optimale Platznutzung
      - Sowohl in Print-Preview als auch beim tatsächlichen Druck
      - CSS Columns für gleichmäßige Platzverteilung
      - `@media print` Regeln stellen sicheres 2-Spalten-Layout beim Drucken sicher
    - **Abteilungssortierung**: Abteilungen werden in der Print-Vorschau und beim Druck nach ihrer konfigurierten Reihenfolge angezeigt
      - Gleiche Sortierung wie auf dem Bildschirm (sort_order aus Datenbank)
      - Konsistente Darstellung über alle Views hinweg
    - **Alphabetische Item-Sortierung**: Items werden innerhalb jeder Abteilung alphabetisch sortiert
      - Gilt für Shopping-Liste und alle Print-Ansichten (Einzel-Geschäft und Alle Geschäfte)
      - Deutsche Sortierung (`localeCompare('de')`) für korrekte Umlaute (ä, ö, ü)
      - Verbessert Übersichtlichkeit und erleichtert das Auffinden von Produkten
    - Automatische Layout-Optimierung: Bei vielen Einträgen (>35 Zeilen) wird die Liste auf Vorder- und Rückseite verteilt
    - Bei wenigen Einträgen: Rückseite zeigt Notizen-Bereich mit Linien
    - **Scrollbare Print-Preview**: Überschrift und Buttons bleiben fixiert, Vorschaubereich ist scrollbar
    - Print-Preview zeigt beide Seiten nebeneinander mit gestrichelter Falzlinie
    - **Kompakter Header**: Geschäftsname und Datum in einer Zeile (ohne "Einkaufsliste -" Präfix)
    - Option zum Ausblenden der Abteilungsüberschriften (Live-Vorschau)
    - Optimierte Schriftgrößen und Abstände für kompakten Druck
    - Keine Aufzählungspunkte, reduzierte Zeilenabstände
    - Abteilungssektionen werden nicht zwischen Spalten aufgeteilt
  - **Geteilte Einkaufsliste**: Alle authentifizierten Benutzer teilen sich eine gemeinsame Einkaufsliste
    - Keine Benutzer-spezifischen Items mehr - alle Items gehören zur gemeinsamen Liste
    - Jeder kann Items hinzufügen, bearbeiten und löschen
    - Items werden mit `user_id=None` erstellt (gehören nicht zu einem spezifischen Benutzer)
    - Ideal für Haushalts-Einkaufslisten, bei denen alle Familienmitglieder die gleiche Liste sehen und bearbeiten
  - **Shopping-Vorlagen**: Wiederverwendbare Einkaufslisten-Vorlagen
    - Vorlagen mit Name, Beschreibung, **Personenanzahl** und Artikeln (inkl. Mengenangaben) erstellen
    - **Personenanzahl-Konfiguration**: Jede Vorlage speichert, für wie viele Personen sie ausgelegt ist (Standard: 2)
      - Eingabefeld "Personenanzahl" beim Erstellen/Bearbeiten von Vorlagen
      - Anzeige in der Vorlagen-Liste: "👥 2 Personen" oder "👥 4 Personen"
      - **Automatische Mengenanpassung im Wochenplan**: Wenn Vorlage im Wochenplan verwendet wird, werden Mengen automatisch basierend auf der gespeicherten Personenanzahl angepasst
      - **Intelligente Skalierung**: `neue_menge = original_menge × (gewünschte_personen / vorlagen_personen)`
        - Beispiel: Vorlage für 4 Personen (500g Nudeln) → Wochenplan für 2 Personen = 250g Nudeln
    - Dedizierte Verwaltungsseite unter `/templates`
    - Vorlagen-Name in Shopping-List eingeben → alle Artikel werden automatisch hinzugefügt
    - Artikel erben ausgewähltes Geschäft und Datum
    - CRUD-Operationen: Erstellen, Bearbeiten, Löschen von Vorlagen
    - Vorlagen-Items werden inline angezeigt: "Artikel (Menge)"
    - "Speichern"-Button nur aktiv wenn mindestens ein Artikel vorhanden ist
    - **Intelligente Filterung**: Echtzeit-Suche für Vorlagen
      - **Filter-Eingabefeld**: Neben der Überschrift "Vorhandene Vorlagen" für schnellen Zugriff
      - **Mehrfach-Suche**: Filtert nach Vorlagen-Namen, Beschreibung UND enthaltenen Artikeln
      - **Live-Filterung**: Sofortige Aktualisierung beim Tippen (case-insensitive)
      - **Clear-Button**: ✕-Button zum schnellen Löschen des Filters (erscheint nur bei Eingabe)
      - **Tastatur-Optimiert**: Enter-Taste setzt Fokus zurück ins Eingabefeld nach dem Löschen
    - **Rekursionsschutz**: Verhindert automatisch, dass Template-Namen als Items verwendet werden
      - Beim Hinzufügen von Items: Warnung, wenn Item-Name einem Template-Namen entspricht
      - Beim Speichern: Validierung gegen eigenen Template-Namen und andere Templates
      - Bei Template-Expansion: Automatisches Überspringen von Items mit Template-Namen
  - **Intelligenter DatePicker mit Einkaufstag-Visualisierung**
    - **Farbcodierte Einkaufstage**: Visuelle Hervorhebung aller geplanten Einkaufstage im Kalender
      - 🟡 **Nächster Einkaufstag** → Gelb mit gelbem Rand
      - 🟢 **Übernächster Einkaufstag** → Grün mit grünem Rand
      - 🎨 **Weitere zukünftige Einkaufstage** → Wechselnde Farben (Lila, Orange, Pink, Teal, Amber, Violett)
      - ⚪ **Vergangene Einkaufstage** → Graustufen zur Kennzeichnung erledigter Einkäufe
    - **Dynamische Datumsfilterung**: Einkaufsliste zeigt nur Items für das ausgewählte Datum
    - **Automatische Updates**: Farbhervorhebungen aktualisieren sich bei Item-Änderungen
    - **Intelligente Sortierung**: Einkaufstage werden chronologisch sortiert und automatisch kategorisiert
    - **Kompakte Darstellung**: Datumsangaben aus Item-Liste entfernt (Datum ist im DatePicker ausgewählt)
  - **Datenbank-Backup & Restore**: Vollständige Datensicherung und Wiederherstellung
    - **JSON-basiertes Backup**: Strukturunabhängig, funktioniert über Software-Updates hinweg
    - **Vollständige Datensicherung**: Alle Datenbank-Inhalte (Benutzer, Geschäfte, Produkte, Vorlagen mit Personenanzahl, Einkaufsliste, Wochenplan)
    - **Einfacher Download**: Backup wird als JSON-Datei heruntergeladen
    - **Validierte Wiederherstellung**: Automatische Format-Validierung vor Restore
    - **Dedizierte Verwaltungsseite**: Unter `/backup` mit Information und Best Practices
    - **Versionsinformationen**: Backup enthält App-Version (aus Git Tags) und Zeitstempel
    - **Sichere Operation**: Warnung vor Datenverlust, Bestätigungsdialog erforderlich
    - Navigation über Benutzermenü: "💾 Datenbank-Backup"
  - **Wochenplan**: Gemeinsamer Essensplan für die ganze Woche
    - **Wochenansicht**: Übersichtliche Kalender-Darstellung mit 7 Tagen (Montag-Sonntag)
    - **3 Mahlzeiten pro Tag**: Unterteilung in Morgens, Mittags, Abends
    - **Gemeinsamer Plan**: Alle Benutzer sehen und bearbeiten denselben Wochenplan
    - **Schnelles Hinzufügen**: Optimierter + Button Workflow
      - **Einzel-Klick**: + Button öffnet Eingabefeld
      - **Smart-Save**: + Button bei ausgefülltem Feld → Speichert Eintrag UND öffnet neues Eingabefeld
      - **Autocomplete-Integration**: Vorschläge aus früheren Wochenplan-Einträgen
      - Ermöglicht schnelles Hinzufügen mehrerer Einträge ohne Maus-Tastatur-Wechsel
    - **Inline-Bearbeitung**: Einträge können sofort gelöscht werden (🗑️-Button)
    - **Wochennavigation**: Vor/Zurück-Buttons zum Durchblättern der Wochen
    - **Aktuelle Woche hervorgehoben**: Heutiger Tag wird farblich markiert
    - **KW-Anzeige**: Kalenderwoche und Datumsbereich werden im Header angezeigt
    - **Interactive Template Preview mit Delta-Management**: Klick auf Wochenplan-Eintrag öffnet Template-Details mit Anpassungsmöglichkeiten
      - **Visual Feedback**: Blaue Hintergrundfarbe, Unterstrich und blauer Text beim Hover
      - **Smart Detection**: Erkennt automatisch ob Eintrag ein Template ist (case-insensitive)
      - **Modal-Anzeige**: Zeigt Template-Name, Beschreibung und alle Items mit Mengen
      - **Personenanzahl-Anpassung**: Mengen können für beliebige Personenanzahl skaliert werden
        - **Eingabefeld für Personenanzahl**: Zeigt aktuelle oder **gespeicherte Personenanzahl der Vorlage** als Ausgangswert
        - **Automatische Mengenberechnung**: Alle Mengen werden mit Faktor `person_count / template_person_count` angepasst
        - **Template-Integration**: Verwendet automatisch die in der Vorlage gespeicherte Personenanzahl als Ausgangswert
        - **Live-Vorschau**: Angepasste Mengen werden sofort in der Template-Liste angezeigt
        - **Persistente Speicherung**: `person_count` wird mit dem WeekplanEntry gespeichert
        - **Automatische Wiederherstellung**: Beim erneuten Öffnen werden gespeicherte Personenanzahl und angepasste Mengen geladen
        - **Einkaufslisten-Synchronisation**: Mengenänderungen werden in der Einkaufsliste korrekt aktualisiert
          - Alte Mengen werden entfernt (mit alter `person_count`)
          - Neue Mengen werden hinzugefügt (mit neuer `person_count`)
        - **Intelligente Einheit-Beibehaltung**: "500 g" × 2 = "1000 g", "2 kg" ÷ 2 = "1 kg"
      - **Delta-Management**: Items können als "nicht benötigt" markiert werden
        - **Checkbox-Steuerung**: Jedes Item hat eine Checkbox zum Deaktivieren
        - **Visuelles Feedback**: Markierte Items werden rot hinterlegt und durchgestrichen
        - **Persistente Speicherung**: Deltas werden mit dem WeekplanEntry gespeichert
        - **Einkaufslisten-Synchronisation**: Änderungen werden sofort auf die Einkaufsliste angewendet
          - Item als "nicht benötigt" markieren → Item wird aus Einkaufsliste entfernt (Menge abgezogen)
          - Item wieder aktivieren → Item wird zur Einkaufsliste hinzugefügt (Menge addiert)
          - Beim Löschen des Eintrags werden nur tatsächlich hinzugefügte Items entfernt
        - **WebSocket-Broadcasting**: Alle Einkaufslisten-Änderungen werden live an verbundene Clients gesendet
      - **Scrollbares Modal-Layout**: Template-Items und hinzugefügte Artikel scrollen, Eingabefelder bleiben fixiert
      - **Keyboard Support**: Modal kann mit Escape-Taste oder Backdrop-Klick geschlossen werden
    - **Template-Integration**: Automatische Einkaufslisten-Generierung aus Wochenplan
      - **Automatisches Hinzufügen**: Wenn Wochenplan-Eintrag einem Template-Namen entspricht, werden Template-Items automatisch zur Einkaufsliste hinzugefügt
      - **Intelligente Datumsberechnung**:
        - Standard-Einkaufsdatum: Nächster MAIN_SHOPPING_DAY (konfigurierbar in .env, Standard: Mittwoch)
        - **Frischeprodukte-Logik**:
          - **Frühstück & Mittagessen**: Frischeprodukte werden am FRESH_PRODUCTS_DAY eingekauft (Standard: Freitag), wenn dieser vor dem Essens-Tag liegt
          - **Abendessen**: Frischeprodukte werden am MAIN_SHOPPING_DAY eingekauft, wenn dieser mit dem Essens-Tag übereinstimmt
            - Beispiel: Abendessen am Mittwoch (= Einkaufstag) → Einkauf am Mittwoch, nicht am Freitag
            - Nur wenn FRESH_PRODUCTS_DAY VOR dem MAIN_SHOPPING_DAY liegt, wird er für Abendessen verwendet
        - **Wichtige Regeln**:
          - **Mahlzeiten-spezifische Logik**:
            - **Abendessen (dinner)**: Einkaufsdatum darf am gleichen Tag wie das Essen sein (≤ Essens-Tag)
            - **Frühstück & Mittagessen (morning/lunch)**: Einkaufsdatum muss VOR dem Essens-Tag liegen (< Essens-Tag)
          - **Vergangenheits-Filter**: Wochenplan-Einträge in der Vergangenheit (< heute) werden ignoriert - keine Items werden zur Einkaufsliste hinzugefügt
          - **Fallback auf heute**: Wenn der berechnete Einkaufstag nach dem Essen liegt, wird heute als Einkaufsdatum verwendet (sofern passend für die Mahlzeit)
      - **Geschäfts-Zuordnung**: Erstes Geschäft nach sort_order wird automatisch verwendet
      - **Intelligente Mengenaddition**: Template-Items werden mit bestehenden Items zusammengeführt
        - Gleiche Einheit → Mengen werden summiert
        - Verschiedene Einheiten → Als semikolon-getrennte Liste gespeichert
      - **Automatisches Entfernen**: Beim Löschen eines Wochenplan-Eintrags werden Template-Items-Mengen subtrahiert
        - Negative Subtraktion reduziert Mengen intelligent
        - Items mit Menge ≤ 0 werden automatisch gelöscht
      - **Exakter Match erforderlich**: Nur bei exakter Übereinstimmung des Wochenplan-Texts mit Template-Namen
      - **Real-time Shopping-List Updates**: Änderungen an der Einkaufsliste durch Wochenplan-Einträge werden live an alle verbundenen Clients übertragen
        - WebSocket-Benachrichtigungen für hinzugefügte/geänderte Items
        - Sofortige Aktualisierung auf allen Geräten
    - **Druckfunktion**: Wochenplan als Tabelle in DIN A4 Querformat drucken
      - **Optimiertes Layout**: 7 Tage-Spalten (Montag-Sonntag) mit Datum unter jedem Tag
      - **3 Zeilen**: Eine Zeile pro Mahlzeit (Morgens, Mittags, Abends)
      - **Plattform-spezifisch**: Popup-Fenster (Desktop/iOS) oder Inline (Android)
      - **A4 Querformat**: Optimale Nutzung des Platzes für übersichtliche Darstellung
    - **Real-time Sync**: Änderungen werden über WebSocket live synchronisiert
      - **Weekplan:add** Event für neue Einträge
      - **Weekplan:delete** Event für gelöschte Einträge
      - Automatische Aktualisierung auf allen verbundenen Clients
    - **Persistente Speicherung**: Alle Einträge werden in der Datenbank gespeichert
    - **Backup-Integration**: Wochenplan-Einträge werden im Datenbank-Backup gesichert
    - Navigation über Benutzermenü: "🗓️ Wochenplan"
- ✅ **Real-time Updates mit WebSocket**: Live-Synchronisation der Einkaufsliste zwischen mehreren Clients
  - **Automatische Synchronisation**: Alle Änderungen werden sofort an alle verbundenen Clients übertragen
    - **Item hinzufügen**: Neue Items erscheinen sofort auf allen Clients
    - **Item löschen**: Gelöschte Items verschwinden sofort überall (auch bei Subtraktion auf 0)
    - **Item aktualisieren**: Mengen-Änderungen (inkl. Subtraktion) und Abteilungs-Zuordnungen werden live synchronisiert
    - **Bulk-Löschungen**: Items, die per Datum gelöscht werden, werden live von allen Clients entfernt
    - **Department-Updates**: Abteilungsnamen- und Sortierreihenfolge-Änderungen werden sofort in allen Shopping-Listen aktualisiert
  - **Smart Broadcasting**: Nur andere Clients werden benachrichtigt (nicht der Absender selbst)
  - **Intelligentes Event-Handling**:
    - Neue Items → `item:add` Event
    - Gelöschte Items → `item:delete` Event
    - Aktualisierte Items (Menge, Abteilung) → `item:update` Event
    - Aktualisierte Departments → `department:updated` Event
  - **Ein-Klick-Aktivierung**: WebSocket-Toggle-Button im Benutzermenü (⋮ → Einstellungen)
    - **"🔌 WebSocket aktivieren"** - Aktiviert WebSocket-Verbindung sofort (ohne Seiten-Reload)
    - **"🔌 WebSocket deaktivieren"** - Trennt WebSocket-Verbindung sofort
    - **Dynamischer Button-Status**: Zeigt aktuellen Verbindungsstatus an
    - **Connection Status Indicator**: Visueller Status (Online/Offline/Neuverbindung) im Header mit User-Count
      - 🟢 **Grün** = Online (connected)
      - 🔵 **Blau (pulsierend)** = Verbinde... (connecting)
      - 🟠 **Orange (pulsierend)** = Neuverbindung... (reconnecting)
      - 🔴 **Rot** = Offline (disconnected)
      - Keine Toast-Benachrichtigungen - visuelle Anzeige ist ausreichend
    - **Active User Count**: Anzeige der Anzahl verbundener Benutzer (z.B. "👥 3")
    - **Sauberes Cleanup**: ConnectionStatus-Instanz wird ordnungsgemäß beim Deaktivieren zerstört (keine Duplikate)
    - **Optimierte Event-Reihenfolge**: ConnectionStatus wird vor WebSocket-Connect erstellt (verhindert Race-Conditions auf mobilen Geräten)
  - **WebSocket-Link teilen**: Neuer Button "📋 WebSocket-Link kopieren" im Benutzermenü
    - **Mobile-First**: Nutzt native Share API auf mobilen Geräten (WhatsApp, E-Mail, etc.)
    - **Desktop**: Kopiert Link automatisch in Zwischenablage mit Toast-Feedback
    - **URL-Format**: Generiert Link mit `?ws=1` Parameter (z.B. `https://ihre-domain.de/app?ws=1`)
    - **Automatische Aktivierung**: Empfänger öffnen Link → WebSocket wird automatisch aktiviert
    - **Ideal für mobile Geräte**: Einfaches Teilen per Messenger oder Mail
  - **Auto-Reconnection**: Automatische Wiederverbindung bei Verbindungsabbruch mit exponentiellem Backoff
  - **Heartbeat-Mechanismus**: Ping/Pong alle 30 Sekunden zur Erkennung stagnierender Verbindungen
  - **Message Queue**: Bis zu 100 Nachrichten werden während Offline-Phasen gepuffert
  - **JWT-Authentifizierung**: Sichere WebSocket-Verbindung mit Token-basierter Authentifizierung
  - **URL-Parameter Aktivierung**: `?ws=1` oder `?enable_ws=true` aktiviert WebSocket automatisch
    - Parameter wird nach Aktivierung aus URL entfernt (clean URL)
    - Einstellung wird in localStorage persistiert
  - **Nahtlose Integration**: WebSocket-Events integrieren sich mit bestehendem Observer Pattern im State Layer
  - **Graceful Degradation**: Bei fehlender WebSocket-Unterstützung funktioniert die App weiterhin über HTTP
  - **Multi-User Support**: Mehrere Benutzer können gleichzeitig die gleiche Liste bearbeiten
  - **Vollständig getestet**: 12 Tests mit Mock-WebSocket für umfassende Abdeckung
- ✅ **Rezept-Integration**: Vollständige Rezeptverwaltung mit WebDAV-Import und Wochenplan-Integration
  - **WebDAV-Rezept-Import**: Importiere Rezepte direkt von deinem WebDAV-Server
    - Unterstützt Nextcloud Cookbook Format (JSON)
    - Massenimport: Verarbeitet tausende Rezepte in einem Durchgang
    - Deduplizierung: Verhindert doppelte Importe basierend auf `external_id`
    - Fehlertoleranz: Import läuft weiter auch bei einzelnen fehlerhaften Rezepten
    - Fortschrittsanzeige: Zeigt Anzahl importierter, übersprungener und fehlerhafter Rezepte
    - Metadaten-Speicherung: Name, Kategorie, Tags, Zutaten, Personenanzahl, Zubereitungszeit
    - Einmalige Konfiguration: WebDAV-Zugangsdaten werden sicher gespeichert
    - Trigger über UI: "📥 Rezepte importieren" Button in WebDAV-Einstellungen
  - **Rezeptsuche im Wochenplan**: Intelligente Suche mit Echtzeit-Vorschlägen
    - **Autocomplete-Integration**: Rezepte erscheinen automatisch in Vorlagen-Vorschlägen
    - **Vorlagenpriorität**: Vorlagen (Templates) werden vor Rezepten angezeigt
    - **Fuzzy-Matching**: Findet Rezepte auch bei Tippfehlern (case-insensitive)
    - **Limit 10**: Maximal 10 Vorschläge für schnelle Auswahl
    - **Rezept-Modal**: Klick auf Rezeptname im Wochenplan zeigt alle Details
      - Rezeptname, Kategorie, Tags, Zubereitungszeit
      - Vollständige Zutatenliste mit Mengen
      - Personenanzahl-Anpassung mit Live-Mengenberechnung
      - Delta-Management: Zutaten als "nicht benötigt" markieren
      - Zusätzliche Items hinzufügen
  - **Automatische Einkaufslisten-Generierung**: Rezeptzutaten werden automatisch zur Einkaufsliste hinzugefügt
    - **Intelligente Zutatenerkennung**: Parst Mengenangaben und Einheiten aus Freitext-Zutaten
    - **Bekannte Einheiten**: g, kg, ml, l, EL, TL, Prise, Stück, Bund, Becher, Dose, Päckchen, Tasse, Stiel, Zweig
    - **Regex-basiertes Parsing**: Erkennt Muster wie "500 g Mehl" oder "2 EL Öl"
    - **Personenanzahl-Skalierung**: Mengen werden automatisch angepasst (Fallback: 1 Person)
      - `neue_menge = original_menge × (gewünschte_personen / rezept_personen)`
      - Beispiel: Rezept für 4 Personen (500g) → 2 Personen = 250g
    - **Intelligente Mengenaddition**: Zutaten werden mit bestehenden Items zusammengeführt
      - Gleiche Einheit → Mengen werden summiert
      - Verschiedene Einheiten → Als semikolon-getrennte Liste
    - **Einkaufstag-Berechnung**: Automatische Zuweisung zum passenden Einkaufsdatum
      - Berücksichtigt MAIN_SHOPPING_DAY und FRESH_PRODUCTS_DAY
      - Frischeprodukte-Logik für optimale Frische
    - **WebSocket-Synchronisation**: Änderungen werden live an alle Clients übertragen
  - **Rezept-Deltamanagement**: Flexible Anpassung von Rezeptzutaten
    - **Checkbox-System**: Einzelne Zutaten als "nicht benötigt" markieren
    - **Visuelles Feedback**: Markierte Items werden rot durchgestrichen
    - **Persistente Speicherung**: Deltas werden mit Wochenplan-Eintrag gespeichert
    - **Einkaufslisten-Sync**: Markierte Items werden automatisch von Einkaufsliste entfernt
    - **Personenanzahl-Änderung**: Bei Anpassung werden alte Items entfernt und neue mit korrekten Mengen hinzugefügt
    - **Zusätzliche Items**: Freies Hinzufügen weiterer Zutaten über Eingabefeld
  - **Recipe-Modell**: Strukturierte Speicherung in SQLite-Datenbank
    - `external_id`: Eindeutige ID vom WebDAV-Server (z.B. "recipe_123")
    - `name`: Rezeptname (indiziert für schnelle Suche)
    - `category`: Kategorie (z.B. "Hauptgericht", "Dessert")
    - `tags`: Komma-getrennte Tags
    - `data`: JSON-Feld mit vollständigen Rezeptdaten (Zutaten, Anleitung, etc.)
    - `imported_at`: Zeitstempel des Imports
  - **API-Endpunkte**: RESTful API für Rezeptverwaltung
    - `GET /api/recipes/search?query=...`: Suche Rezepte nach Namen (max 10 Ergebnisse)
    - `GET /api/recipes/{id}`: Hole einzelnes Rezept mit allen Details
    - `GET /api/recipes?skip=0&limit=50`: Paginated Liste aller Rezepte
    - `POST /api/webdav/import-recipes`: Trigger manuellen Rezept-Import von WebDAV
    - Alle Endpunkte erfordern JWT-Authentifizierung
- ✅ **Semantic Versioning**: Automatische Versionsverwaltung mit Git Tags und Conventional Commits
  - **GitHub als Single Source of Truth**: Versionsnummern werden aus Git Tags extrahiert
  - **Conventional Commits**: Commit-Format bestimmt automatisch Version-Bumps
    - `feat:` → MINOR bump (0.1.0 → 0.2.0)
    - `fix:` → PATCH bump (0.1.0 → 0.1.1)
    - `BREAKING CHANGE:` → MAJOR bump (0.1.0 → 1.0.0)
    - `chore:`, `docs:`, etc. → kein bump
  - **Vollautomatische Releases**: Push zu master → GitHub Actions erstellt Release automatisch
  - **API-Endpoint**: `/api/version` gibt aktuelle Version zurück (JSON mit `version` und `api`)
  - **UI-Anzeige**: Version wird im Benutzermenü (⋮) am Ende des Dropdowns angezeigt
  - Siehe [VERSIONING.md](VERSIONING.md) für Details zum Release-Workflow
- ✅ **Store-Verwaltung**: Dedizierte Admin-Seite für Geschäfte und Abteilungen
  - **CRUD-Operationen**: Erstellen, Bearbeiten und Löschen von Stores und Departments
  - **Geschäfts-Sortierung**: Reihenfolge der Geschäfte mit ↑↓ Buttons ändern
  - **Abteilungs-Sortierung**: Reihenfolge der Abteilungen bestimmt die Anzeige in der Shopping-Liste
  - Navigation über Benutzermenü: "🏪 Geschäfte verwalten"
- ✅ **Produkt-Verwaltung**: Dedizierte Admin-Seite für Produkte
  - **CRUD-Operationen**: Erstellen, Bearbeiten und Löschen von Produkten
  - **Store- und Department-Zuordnung**: Jedes Produkt ist einem Store und einer Abteilung zugeordnet
  - **Frische-Kennzeichnung**: Optionale Markierung für frische/verderbliche Produkte
  - **Intelligenter Filter**: Live-Suche mit schnellem Debouncing (50ms)
    - Suche in Produktnamen, Abteilungsnamen und "frisch"-Keyword
    - Counter-Anzeige: "X von Y" Produkten gefunden
    - Clear-Button (✕) zum schnellen Löschen des Filters
  - **Alphabetische Sortierung**: Produkte werden innerhalb jeder Abteilung alphabetisch sortiert
    - Deutsche Locale für korrekte Umlaute (ä, ö, ü)
    - Case-insensitive Sortierung
  - Navigation über Benutzermenü: "📦 Produkte verwalten"
- ✅ **Mengenangaben mit Smart-Merging & Fuzzy Matching**: Optionale Mengenangaben für jeden Artikel (z.B. "500 g", "2 Stück")
  - **Default-Wert "1"**: Mengenfeld ist standardmäßig auf "1" vorausgefüllt für schnelleres Hinzufügen
  - **Semikolon-getrennte Eingaben**: Mehrere Mengen gleichzeitig eingeben (z.B. "2; 500 g")
  - Automatisches Summieren von Mengen mit gleicher Einheit
  - **Intelligente Subtraktion**: Negative Mengen (mit `-` Präfix) werden intelligent subtrahiert
    - "Möhren 500 g" + "-300 g" = "Möhren 200 g"
    - Wenn die Menge auf 0 oder darunter geht, wird das Item automatisch gelöscht
    - Negative Mengen ohne bestehendes Item werden ignoriert (man kann nicht von nichts subtrahieren)
  - Intelligente Suche in semikolon-getrennte Listen
  - **Case-Insensitive Matching**: Groß-/Kleinschreibung wird ignoriert
  - **Fuzzy Matching**: Ähnliche Produktnamen werden automatisch zusammengeführt
    - "Möhre" wird zu "Möhren" hinzugefügt (Singular/Plural)
    - "Moehre" wird zu "Möhren" hinzugefügt (alternative Schreibweise)
  - **Datums-basiertes Merging**: Mengen werden NUR summiert, wenn das Einkaufsdatum identisch ist
    - Items mit unterschiedlichen Einkaufsdaten werden separat geführt
    - Ermöglicht Planung für mehrere Einkaufstouren
- ✅ **Einkaufsdatum**: Optionale Datumsangabe für geplanten Einkauf
  - **DatePicker-Komponente**: Benutzerfreundlicher Kalender mit deutscher Lokalisierung
  - **Konfigurierbare Vorauswahl**: Standard-Einkaufstag ist über `.env` konfigurierbar (`MAIN_SHOPPING_DAY`, Standard: Mittwoch)
  - **Visuelles Design**: Aktueller Tag ist deutlich hervorgehoben (rot hinterlegt)
  - **Flexibel**: Datum kann geändert oder gelöscht werden
  - **Intelligentes Merging**: Items werden nur bei gleichem Datum zusammengeführt
- ✅ **Reaktive UI**: Automatische UI-Updates durch State-Management mit Observer Pattern
- ✅ **Component Library**: Wiederverwendbare UI-Komponenten mit konsistentem Design (9 Komponenten)
  - **Button**: Konfigurierbare Buttons (primary, secondary, danger) mit verschiedenen Größen
  - **Modal**: Modale Dialoge mit Backdrop und Animationen
  - **Card**: Content-Cards mit optionalen Aktionen
  - **Input**: Formular-Inputs mit Validierung und Fehleranzeige
  - **Loading**: Spinner, Overlay und Skeleton-Loader
  - **Dropdown**: Native und durchsuchbare Dropdown-Menüs mit Fuzzy-Search
  - **Tabs**: Tab-Navigation für organisierte Content-Bereiche
  - **Toast**: Nicht-blockierende Benachrichtigungen (success, error, warning, info)
  - **DatePicker**: Voll funktionsfähiger Kalender für Datumsauswahl mit deutscher Lokalisierung
- ✅ **Vollständige Tests**: 509 Tests (64 Server + 445 Client) mit 85%+ Code-Abdeckung
- ✅ **TypeScript Client**: Typsicherer Client mit vier-Schichten-Architektur
- ✅ **FastAPI Server**: Moderne Python API mit SQLModel ORM
- ✅ **Benutzer-Verwaltung**: Freischaltungs-System für neue Benutzer
  - **Administrator-Account**: Wird automatisch beim Serverstart aus `.env` erstellt/aktualisiert
  - **Freischaltungs-Prozess**: Neue Benutzer müssen von freigeschalteten Benutzern genehmigt werden
  - **Verwaltungsseite**: Dedizierte `/users` Seite mit übersichtlicher Card-basierter UI
  - **Admin-Funktionen**: Benutzer freischalten, Benutzer löschen (Schutz vor Selbst-Löschung)
  - **Auto-Cleanup**: Nicht freigeschaltete Benutzer werden nach konfigurierbarer Zeit automatisch gelöscht
  - **Selbstverwaltung**: Jeder Benutzer (außer Administratoren) kann den eigenen Account löschen
  - Navigation über Benutzermenü: "👥 Benutzer verwalten"
- ✅ **Zentralisiertes Dropdown-Menü**: Dynamisch geladenes, hierarchisches Benutzermenü
  - **Single Source of Truth**: Menü-Template wird zentral in `menu-dropdown.html` verwaltet
  - **Hierarchische Struktur**: Zwei Submenüs für logische Gruppierung (Verwaltung, Einstellungen)
  - **Smooth Animations**: Max-height-Transition für sanftes Auf-/Zuklappen
  - **Automatisches Cleanup**: Submenüs schließen sich beim Klick außerhalb

## Schnellstart

### Voraussetzungen

- Python 3.13+ (empfohlen) oder Python 3.10+
- Node.js 16+ für TypeScript/Client-Build

### Installation

1. **Repository klonen**
   ```bash
   git clone https://github.com/lka/client_server_einkaufsliste.git
   cd client_server_einkaufsliste
   ```

2. **Virtuelle Umgebung erstellen und aktivieren**
   ```bash
   python -m venv venv

   # Windows
   venv\Scripts\activate

   # macOS/Linux
   source venv/bin/activate
   ```

3. **Python-Abhängigkeiten installieren**
   ```bash
   pip install -r requirements.txt
   ```

4. **Umgebungsvariablen konfigurieren**

   Kopiere `.env.example` zu `.env` und passe die Werte an:
   ```bash
   cp .env.example .env
   ```

   Wichtigste Einstellungen in `.env`:
   ```bash
   # JWT Secret - WICHTIG: Ändere dies in Produktion!
   SECRET_KEY=your-secret-key-here-change-in-production

   # Token Gültigkeit (in Minuten)
   ACCESS_TOKEN_EXPIRE_MINUTES=30

   # Administratorpasswort für ersten Setup
   ADMIN_PASSWORD=admin123

   # Datenbank-Konfiguration
   DATABASE_URL=sqlite:///./data.db

   # Shopping Day Configuration (Python convention: 0=Monday, 6=Sunday)
   MAIN_SHOPPING_DAY=2        # Wednesday (2)
   FRESH_PRODUCTS_DAY=4       # Friday (4)
   ```

5. **Client Build (TypeScript)**
   ```bash
   cd client
   npm install
   npm run build
   cd ..
   ```

6. **Server starten**
   ```bash
   # Entwicklungsserver (mit Auto-Reload)
   python -m uvicorn server.src.main:app --reload --port 8000

   # Oder Produktionsserver
   python server/src/app.py
   ```

7. **Anwendung öffnen**

   Öffne im Browser: `http://localhost:8000`

   **Erste Schritte:**
   - Login mit Admin-Credentials (Username: `admin`, Passwort aus `.env`)
   - Oder: Neuen Benutzer registrieren (muss von Admin genehmigt werden)

### Netzwerkzugriff (von anderen Geräten)

1. Notieren Sie die Network-URL, die beim Serverstart angezeigt wird (z.B. `http://192.168.1.100:8000`)
2. Öffnen Sie die Network-URL auf einem anderen Gerät im gleichen Netzwerk
3. Stellen Sie sicher, dass die Firewall den Port 8000 erlaubt (siehe DEVELOPER.md für Details)

## Benutzung

### Navigation im Benutzermenü

Das Benutzermenü (⋮) im Header der Anwendung ist hierarchisch organisiert:

**⚙️ Verwaltung** (Administration)
- **🏪 Geschäfte verwalten**: Geschäfte und Abteilungen erstellen, bearbeiten und sortieren
- **📦 Produkte verwalten**: Produkte in Geschäften verwalten
- **👥 Benutzer verwalten**: Benutzer freigeben und verwalten (Admin-Funktion)
- **📋 Vorlagen**: Einkaufslisten-Vorlagen erstellen und bearbeiten
- **🗓️ Wochenplan**: Wochenplan für Mahlzeiten verwalten

**⚙️ Einstellungen** (Settings)
- **🔌 WebSocket aktivieren**: Live-Synchronisation zwischen Geräten einschalten
- **📋 WebSocket-Link kopieren**: Link zum Teilen mit anderen Benutzern
- **💾 Datenbank-Backup**: Datenbank sichern und wiederherstellen

### Einkaufsliste verwenden

Nach dem Login können Sie die Einkaufsliste verwenden:

1. **Automatische Geschäfts-Auswahl**: Das erste Geschäft wird automatisch ausgewählt
2. **Produkte hinzufügen**: Geben Sie den Produktnamen ein (z.B. "Möhren")
3. **Automatisches Matching**: Das System findet automatisch das passende Produkt im Katalog
4. **Abteilungs-Gruppierung**: Items werden automatisch nach Abteilungen gruppiert angezeigt
5. **Items entfernen**: Klicken Sie auf das Papierkorb-Icon (🗑️) neben dem Item
6. **Produktkatalog erweitern**: Items in "Sonstiges" können dem Katalog hinzugefügt werden
   - Klicken Sie auf das Bearbeiten-Icon (✏️) neben einem Item in "Sonstiges"
   - Wählen Sie eine Abteilung aus dem Dialog
   - Das Produkt wird automatisch dem Katalog hinzugefügt

### Rezepte verwenden

1. **WebDAV-Einstellungen konfigurieren** (einmalig):
   - Klicken Sie auf das Menü (⋮) im Header
   - Wählen Sie **"☁️ WebDAV Einstellungen"**
   - Erstellen Sie eine neue WebDAV-Konfiguration mit Ihren Nextcloud-Zugangsdaten
   - Geben Sie den Pfad zur recipes.json an (z.B. `/remote.php/dav/files/USERNAME/Recipes/recipes.json`)

2. **Rezepte importieren**:
   - In den WebDAV-Einstellungen, klicken Sie auf **"📥 Rezepte importieren"**
   - Der Import läuft im Hintergrund und zeigt Fortschritt an
   - Erfolgsmeldung zeigt Anzahl importierter Rezepte

3. **Rezepte im Wochenplan verwenden**:
   - Gehen Sie zum **"🗓️ Wochenplan"**
   - Geben Sie Rezeptname in ein Essensfeld ein
   - Rezepte erscheinen in Autocomplete-Vorschlägen (nach Vorlagen)
   - Wählen Sie ein Rezept aus

4. **Rezeptdetails und Anpassungen**:
   - Klicken Sie auf den Rezeptnamen im Wochenplan
   - Modal zeigt alle Zutaten mit Mengen
   - **Personenanzahl anpassen**: Eingabefeld ändert alle Mengen proportional
   - **Zutaten deaktivieren**: Checkboxen zum Abwählen nicht benötigter Items
   - **Zusätzliche Items**: Fügen Sie eigene Zutaten hinzu
   - Alle Änderungen werden automatisch in der Einkaufsliste übernommen

5. **Automatische Einkaufsliste**:
   - Rezeptzutaten werden automatisch zur Einkaufsliste hinzugefügt
   - Mengen werden basierend auf Personenanzahl berechnet
   - Passende Einkaufstage werden automatisch zugewiesen
   - Items werden mit bestehenden Einträgen intelligent zusammengeführt

### Geschäfte und Produkte verwalten

**Geschäfte und Abteilungen verwalten:**
1. Klicken Sie auf das Menü (⋮) im Header
2. Wählen Sie **"🏪 Geschäfte verwalten"**
3. Erstellen, bearbeiten oder löschen Sie Stores und Departments
4. **Geschäftsreihenfolge ändern**: Nutzen Sie die ↑↓ Buttons im Store-Header
5. **Abteilungsreihenfolge ändern**: Nutzen Sie die ↑↓ Buttons neben jeder Abteilung

**Produkte verwalten:**
1. Klicken Sie auf das Menü (⋮) im Header
2. Wählen Sie **"📦 Produkte verwalten"**
3. Wählen Sie ein Geschäft aus dem Dropdown
4. Erstellen, bearbeiten oder löschen Sie Produkte

### Vorlagen verwenden

1. Klicken Sie auf das Menü (⋮) im Header
2. Wählen Sie **"📋 Vorlagen"**
3. Erstellen Sie Vorlagen mit wiederkehrenden Einkaufslisten-Items
   - **Name**: z.B. "Pasta Carbonara"
   - **Beschreibung** (optional): Details zum Rezept
   - **Personenanzahl**: Für wie viele Personen ist die Vorlage gedacht? (Standard: 2)
   - **Artikel**: Fügen Sie Artikel mit Mengenangaben hinzu
4. In der Shopping-Liste: Geben Sie den Vorlagen-Namen ein → alle Items werden automatisch hinzugefügt
5. Im Wochenplan: Vorlage als Eintrag verwenden → Mengen können für andere Personenanzahl angepasst werden

### Wochenplan nutzen

1. Klicken Sie auf das Menü (⋮) im Header
2. Wählen Sie **"🗓️ Wochenplan"**
3. Fügen Sie Mahlzeiten für die Woche hinzu
4. Bei Template-Namen: Items werden automatisch zur Einkaufsliste hinzugefügt
5. Navigation zwischen Wochen mit Vor/Zurück-Buttons

### WebSocket aktivieren (für Live-Updates)

1. Klicken Sie auf das Menü (⋮) im Header
2. Wählen Sie **"Einstellungen"** → **"🔌 WebSocket aktivieren"**
3. Alle Änderungen werden jetzt live auf allen verbundenen Geräten synchronisiert
4. Teilen Sie den WebSocket-Link mit anderen Benutzern: **"📋 WebSocket-Link kopieren"**

### Datenbank-Backup erstellen

1. Klicken Sie auf das Menü (⋮) im Header
2. Wählen Sie **"Einstellungen"** → **"💾 Datenbank-Backup"**
3. Laden Sie das Backup als JSON-Datei herunter
4. Für Wiederherstellung: Backup-Datei hochladen auf der gleichen Seite

## Authentifizierung

Die Anwendung verwendet **JWT (JSON Web Tokens)** für sichere Authentifizierung:

### Registrierung und Login

1. **Registrierung**: Besuchen Sie http://localhost:8000/ und erstellen Sie einen Account
   - Benutzername, E-Mail und Passwort eingeben
   - Passwörter werden mit bcrypt sicher gehasht
   - Passwortlänge: 6-72 Zeichen
   - Neue Benutzer müssen von einem Administrator freigegeben werden

2. **Login**: Melden Sie sich mit Ihren Zugangsdaten an
   - Bei erfolgreicher Anmeldung erhalten Sie einen JWT-Token
   - Token wird automatisch im localStorage gespeichert
   - Token ist 30 Minuten gültig (konfigurierbar in `.env`)

3. **Automatisches Token-Refresh**: Bei jedem API-Aufruf wird das Token automatisch erneuert
   - Dies verlängert die Token-Gültigkeit bei jeder Aktivität
   - Kein Timeout bei aktiver Nutzung

4. **Inaktivitäts-Logout**: Nach Ablauf der Token-Gültigkeit bei Inaktivität werden Sie automatisch abgemeldet

### Account-Verwaltung

- Klicken Sie auf das **Drei-Punkte-Menü** (⋮) in der rechten oberen Ecke
- **Abmelden**: Wählen Sie "Abmelden" um sich auszuloggen (Token wird gelöscht)
- **Account löschen**: Gehen Sie zu "👥 Benutzer verwalten" → "Eigenen Account löschen" (nur für Nicht-Administratoren)

### Sicherheitshinweise

- **Ändern Sie `SECRET_KEY` in Produktion**: Der Standard-Wert ist nur für Development geeignet
- **Sichere Passwörter**: Verwenden Sie starke Passwörter mit mindestens 8 Zeichen
- **HTTPS in Produktion**: Verwenden Sie einen Reverse-Proxy (nginx, Apache) mit SSL/TLS-Zertifikaten
- **Firewall**: Beschränken Sie den Zugriff auf Port 8000 auf vertrauenswürdige Netzwerke

## Für Entwickler

Technische Dokumentation, Architektur-Details, API-Endpunkte, Testing und Entwickler-Workflows finden Sie in der [DEVELOPER.md](DEVELOPER.md).

Inhalte:
- Detaillierte Projektstruktur
- Installation & Entwicklungsumgebung
- API-Endpunkte Dokumentation
- Code-Qualität (Black, Flake8)
- Testing (pytest, jest)
- Continuous Integration
- Architektur (Server & Client)
- Troubleshooting

## Lizenz

Dieses Projekt ist Open Source. Siehe LICENSE-Datei für Details.

## Weiterführende Links

- [DEVELOPER.md](DEVELOPER.md) - Technische Dokumentation
- [VERSIONING.md](VERSIONING.md) - Release-Workflow und Semantic Versioning
- [FastAPI Dokumentation](https://fastapi.tiangolo.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
