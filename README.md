# English-Voc

Vokabeltrainer für Englisch C1 und C2 (amerikanisches Englisch), 4.884 Karten. PWA ohne Build-Schritt.

- Wort des Tages, Karten-Sitzungen, Kasten „Nicht gewusst“ (Wiederholung nach zufällig 8 bis 20 Sitzungen)
- Toggle Englisch/Deutsch (Flaggen) und Hell/Dunkel
- Filter nach Niveau (C1/C2) und 13 Themen
- Sichern per Web Share (Hinweis „Gesichert ✓“) und Wiederherstellen aus Datei
- Offline-fähig (Service Worker)

## Veröffentlichen mit GitHub Pages
Repo `mkoebrich/English-Voc`: Settings → Pages → Branch `main`, Ordner `/ (root)`.
Die App läuft dann unter `https://mkoebrich.github.io/English-Voc/`.

## Lokal testen
```bash
python3 -m http.server 8000
```

## Update ausliefern
In `sw.js` die `VERSION` erhöhen, damit installierte Apps den Cache erneuern.
