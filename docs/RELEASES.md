# Releases

> **📚 Alle Dokumentationen:** Siehe [Dokumentations-Index](INDEX.md)

- Release 6.9.0: SingleDay – Fresh-Items in Haupt-Einkaufstag zusammenführen
  - Items mit `fresh`-Status werden beim Aktivieren von `singleDay` automatisch in den Haupt-Einkaufstag übernommen

- Release 6.8.0: Auto-Add beim Speichern in Rezept- und Template-Modal
  - Ausstehende (pending) Items werden beim Speichern automatisch zur Einkaufsliste hinzugefügt

- Release 6.7.6: Bugfix – Fresh-Items bei singleDay korrekt entfernen
  - Items mit `fresh`-Status werden aus der Einkaufsliste entfernt, wenn `singleDay` aktiv ist

- Release 6.7.5: Bugfix – Einkaufsliste nach Wochenplan-Update neu laden
  - Einkaufsliste wird nach einem Wochenplan-Broadcast korrekt aktualisiert

- Release 6.7.4: Bugfix – Docker Build repariert

- Release 6.7.3: Bugfix – Items in Einkaufsliste hinzufügen/löschen (#88)
  - Vollständiges Hinzufügen und Löschen von Items in der Einkaufsliste wiederhergestellt

- Release 6.7.2: Bugfix – State-Verwaltung Server/Client (#89)
  - State wird im Server gehalten, aus localStorage entfernt

- Release 6.7.1: Docker Container Link in externe Ressourcen aufgenommen

- Release 6.7.0: Wochenplan-Duplexdruck
  - **Druckauswahl-Dialog**: Beim Klick auf den Drucken-Button erscheint eine Auswahl
    - **Nur diese Woche**: Aktuelle Woche auf einer Seite (bisheriges Verhalten)
    - **Diese + nächste Woche**: Nächste Woche wird automatisch vom Server geladen und auf der Rückseite gedruckt (Duplexdruck, kurze Seite umwenden)
  - Druckhinweis im Popup empfiehlt Querformat und Duplex (kurze Seite umwenden)
  - Plattform-spezifisch: Popup-Fenster (Desktop/iOS) oder Inline (Android)

- Release 6.0.0: Herstellerbezeichnung + Rezept-Klammer-Entfernung + Modal-UX-Verbesserungen
    - **Optionale Herstellerbezeichnung für Produkte**: Produkte können jetzt eine zusätzliche herstellerspezifische Bezeichnung haben
        - Datenbankfeld `manufacturer_designation` (nullable, max 200 Zeichen)
        - Database-Migration mit Backward-Compatibility
        - Vollständige Integration in Produkt-Verwaltung UI
        - Automatische Übernahme in Einkaufslisten-Items via Fuzzy-Matching
        - WebSocket-Broadcasting für Echtzeit-Updates bei Produktänderungen
        - **Automatische Klammer-Entfernung in Rezeptzutaten**: Inhalte in runden Klammern werden automatisch entfernt
        - Klammern am Ende: "Mehl (Type 405)" → "Mehl"
        - Klammern in der Mitte: "Tomaten (geschält) gewürfelt" → "Tomaten gewürfelt"
        - Mehrfache Klammern: "Kartoffeln (festkochend) (geschält)" → "Kartoffeln"
        - Konsistente Behandlung beim Hinzufügen und Entfernen von Rezeptzutaten
    - **Modal-UX-Verbesserungen**: Optimierte Benutzeroberfläche in Rezept- und Template-Modals
        - Duplikate erlaubt: Zutaten können mehrfach hinzugefügt werden (z.B. verschiedene Mengen)
        - Hellgrüne Hinterlegung für hinzugefügte Artikel (#e8f5e9)
        - Kompakte Ansicht: Überflüssige Überschriften und Trennlinien entfernt
    - **Test-Coverage**: 577 Tests (103 Server + 474 Client) mit umfassenden Test-Cases für alle Features
- Release 5.1.3: WebDAV-UX-Verbesserungen
  - **Fortschrittsanzeige beim Rezept-Import**: Echtzeit-Updates mit Server-Sent Events
    - Detaillierte Fortschrittsinformationen (Dateianzahl, importierte Rezepte)
    - Visueller Fortschrittsbalken mit Prozentanzeige
    - Statusnachrichten für jeden Import-Schritt
  - **Größere Buttons in WebDAV-Admin**: Verbesserte Bedienbarkeit mit größeren, besser klickbaren Buttons
- Release 5.1.2: Bug fixes für Attribute in Modal und Print-Controls
- Release 5.1.1: Bug fixes für Attribute von Input-Feldern
- Release 3.1.0: Einheiten-Verwaltung + Bruchzahlen-Unterstützung
  - Einheiten aus Datenbank statt hardcoded (CRUD-UI mit Drag & Drop)
  - Bruchzahlen in Rezepten (½, ¼, ¾, 1½, etc.) bei Parsing, Addition und Skalierung
  - WebSocket-Synchronisation für Einheiten-Änderungen
  - Backup-Integration für Einheiten
- Release 3.0.0: Rezept-Integration - WebDAV-Import, Rezeptsuche und automatische Einkaufslisten-Generierung
 - Release 2.3.0: Personenanzahl in Vorlagen konfigurierbar + automatische Integration im Wochenplan
 - Release 2.2.0: Personenanzahl-Anpassung im Wochenplan-Modal + Shopping-Day-Bugfix
 - Release 2.1.0: Template-Items mit Mengenanpassung
 - Release 2.0.0: Wochenplaneinträge zeigen einen Preview
 - Release 1.5.0: WebSocket-Notifications hinzugefügt
 - Release 1.4.0: Wochenplaner integriert
 - Release 1.0.0: Erste stabile Version