# Tower Stats - Setup & Troubleshooting Guide

## 🚀 Quick Start (Recommended)

**Double-click `start-all.bat` - Das war's!**

Das Script startet automatisch:
1. Web Server (Port 6079)
2. Discord Bot
3. Öffnet Browser mit Dashboard

---

## 🔧 Manual Setup (Falls nötig)

### 1. Web Server starten
```bash
cd server
PORT=6079 node server.js
```

### 2. Discord Bot starten (SEPARAT!)
```bash
cd server
node bot-launcher.js
```

### 3. Browser öffnen
Gehe zu: `http://localhost:6079`

---

## ⚠️ Häufige Probleme & Lösungen

### Problem: "Die Anwendung reagiert nicht" (Discord Bot)
**Lösung:** Discord Bot läuft nicht!
```bash
cd server
node bot-launcher.js
```

### Problem: Keine Discord-Daten im Dashboard
**Ursachen:**
1. ❌ Discord Bot nicht gestartet → `node bot-launcher.js`
2. ❌ Falscher Port → Prüfe dass Server auf 6079 läuft
3. ❌ Browser Cache → Drücke Ctrl+F5 für Hard Refresh

### Problem: 404/500 Fehler
**Lösung:** Server aus richtigem Verzeichnis starten:
```bash
cd server && PORT=6079 node server.js
```

### Problem: Dashboard zeigt alte Daten
**Lösung:** Browser Cache leeren
- Chrome/Edge: Ctrl+Shift+R
- Firefox: Ctrl+F5

---

## 📊 Endpunkte & Features

### Discord Bot Commands
- `/submit` - Tower Run-Daten einreichen
- `/link` - Discord Account verknüpfen
- `/stats` - Deine letzten Runs anzeigen
- `/leaderboard` - Server Leaderboard
- `/help` - Hilfe anzeigen

### API Endpunkte
- `GET /api/tower/runs` - Alle Runs abrufen
- `DELETE /api/tower/runs/:id` - Run löschen
- `GET /api/discord-runs` - Discord Bot Runs
- `GET /api/status` - Server Status

### Dashboard Sections
- **Dashboard** - Übersicht & Statistiken
- **Tower Analytics** - Detaillierte Analyse (hier erscheinen Discord-Daten!)
- **Achievements** - Erfolge tracken
- **Content Hub** - YouTube & Reddit Content

---

## 🐛 Debug & Logs

### Server Logs überprüfen
Die Konsolen-Fenster zeigen alle Logs:
- **Web Server:** API Calls, Database Queries
- **Discord Bot:** Bot Commands, Data Processing

### Wichtige Log-Meldungen
✅ **Erfolgreich:**
```
✅ Tower routes using unified database
🤖 Tower Bot is ready! Logged in as social-tower#2569
✅ Database save completed, result: SUCCESS
```

❌ **Fehler:**
```
⚠️ Supabase URL not configured
❌ Discord bot not running
Server error: ENOENT: no such file
```

---

## 🔄 Nach Updates

Wenn Code geändert wurde:
1. Beide Konsolen schließen (Ctrl+C)
2. `start-all.bat` erneut ausführen
3. Browser mit Ctrl+F5 refreshen

---

## 📋 Checkliste für Vollständiges Setup

- [ ] Web Server läuft auf Port 6079
- [ ] Discord Bot ist online (`social-tower#2569`)
- [ ] Dashboard lädt unter `http://localhost:6079`
- [ ] Discord Commands funktionieren (`/submit` Test)
- [ ] Tower Analytics zeigt Discord-Daten an
- [ ] Delete Endpoint funktioniert

**Bei Problemen:** Prüfe beide Konsolen-Fenster auf Error-Meldungen!