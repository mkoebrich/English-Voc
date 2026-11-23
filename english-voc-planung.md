# English-Voc: Planungsdokument

Stand: 23.11.2026 (Daten fertig: vocab.json mit 4.884 Karten; nächster Schritt: App-Bau im Code-Tab)

## 1. Ziel
Private Vokabel-App für Englisch **C1 und C2** im Stil von Farsi-Voc (Karteikarten, ohne Eintippen, PWA auf dem iPhone, ab Dezember auch Android). Name: **English-Voc**.

## 2. Entscheidungen
- **Stil:** wie Farsi-Voc. Wort des Tages, Karten-Sitzung, Kasten „Nicht gewusst“, Sichern und Wiederherstellen per Web Share API (Hinweis „Gesichert ✓“), Wiederholabstand zufällig 8 bis 20 Sitzungen. Details siehe `claude/vokabeltrainer-planung.md`, Abschnitte 3, 4 und 8.
- **Entfällt:** Umschrift (Finglish).
- **Neu:** Toggle Englisch/Deutsch (Flagge USA / Flagge Deutschland) und Hell/Dunkel-Toggle.
- **Spelling:** ausschließlich **amerikanisches Englisch**.
- **Niveaus:** nur C1 und C2. **B2 entfällt.**
- **Umfang:** **4.884 Einträge** (C1 3.158, C2 1.726), nach Bereinigung von 3 Dubletten (siehe Abschnitt 8).
- **Icon:** **Variante F** (US-Flagge als Hintergrund, „C2“ im weißen Kreis unten rechts); icon-192, icon-512, apple-touch-icon.
- **Texte:** Synonyme, Antonyme, Beispielsätze und alle Kästen hat Claude selbst geschrieben. Die Quellen liefern nur Wörter und Niveaus.
- **Umsetzung:** Daten im Chat (fertig), App-Bau im Code-Tab mit Sonnet 5.5 (Medium). Kein Commit, kein Push und keine Branches durch Claude; Dateien kommen per SendUserFile zurück.

## 3. Quellen (Ordner Claude_App_EnglishC1C2)
| Quelle | Liefert | Niveau |
|---|---|---|
| The Oxford 5000 | Wort + Wortart | C1 |
| English-wordlist-C1 (Langeek) | Wort, Wortart, IPA, Definition, Themen | C1 |
| Level-C2-Word-List (English Vocabulary Profile) | Wort, IPA, Bedeutungen, Wortfamilie | C2 |
| C1 CAE / C2 CPE (engxam) | Wort + Definition nach Themen | C1 / C2 |
| C1C2 LTE | Themenwörter, Phrasal Verbs, Redewendungen | C1/C2 |
| C1 Vocabulary Pack (Intercambio) | Phrasal Verbs, Wortbildung, Redewendungen | C1 |
| 282 Advanced IELTS Vocabulary | Wort + Niveau, Struktur der Kästen | C1/C2 |
| Studydrive | 113 Karten Englisch → Deutsch | C1/C2 |

## 4. Extraktion
- Rohliste: 5.397 Einträge; reine B2-Wörter (497) nicht aufgenommen.
- Wörter aus B2 plus C1/C2-Liste (202) sind drin und tragen das höhere Niveau.
- Mehrere C-Niveaus: das niedrigere gilt als Hauptniveau.
- Mehrwortausdrücke liegen im Thema „Phrasal Verbs und Redewendungen“ oder im Fachthema.
- Bekannte Schwäche: Die C2-Liste enthält einfache Wörter (z. B. *at*, *worth*); die Karte zeigt dann die C2-Bedeutung.

## 5. Kategorien
**Niveau:** C1, C2.

**Thematisch (13):** Umwelt und Nachhaltigkeit; Wissenschaft und Technik; Kunst und Kultur; Politik und Gesellschaft; Recht und Kriminalität; Wirtschaft und Finanzen; Gesundheit und Medizin; Bildung und Forschung; Arbeit und Beruf; Gefühle und Persönlichkeit; Argumentieren und Überzeugen; Phrasal Verbs und Redewendungen; Allgemein.

## 6. Kasten pro Wort
Wort, Wortart, IPA, Niveau, Thema, deutsche Übersetzung, englische Definition, Synonyms, Antonyms, Example, IELTS writing, IELTS speaking, Wortfamilie, Kollokationen, Register, häufiger Fehler bei Deutschsprachigen. Leere Felder werden nicht angezeigt.

## 7. Datenformat (final)
`vocab.json`: `{ "meta": {...}, "C1": [Karten], "C2": [Karten] }`. Karte: `id, en, level, pos, ipa, cat, de, def, syn[], ant[], example, ielts_writing, ielts_speaking, family[], collocations[], register, mistake, sources[]`. Die ids sind eindeutig, aufsteigend und haben Lücken (siehe Abschnitt 8).

## 8. Status der Daten
- **Fertig:** alle 33 Blöcke geschrieben, geprüft und gemerged; `vocab.json` liegt vor (4.884 Karten).
- **Checks bestanden:** alle Pflichtfelder gefüllt, ids eindeutig und sortiert, keine britischen Schreibweisen, Validator ohne offene Flags.
- **Lücken in den ids** (nicht in der Quelle vorhanden): 121, 729, 730, 1159, 1177, 1244, 1950, 3986.
- **Entfernte Dubletten:** 2629 (skeptical), 3539 (diarrhea), 3181 (close).
- **Korrigierte Quellfehler:** whiteout, close, whereabouts, diarrhea (zuvor diarrhoea).

## 9. Icon
**Variante F:** US-Flagge als Quadrat mit abgerundeten Ecken, unten rechts ein weißer Kreis mit „C2“ in Blau.

## 10. Nächste Schritte
1. In den Code-Tab wechseln (Sonnet 5.5, Medium) und den Bau-Prompt mit `vocab.json` und den beiden Planungsdokumenten geben.
2. Neues Repo `mkoebrich/English-Voc` mit GitHub Pages und PWA, Filter nach Niveau und Thema.
3. Stichproben der deutschen Übersetzungen durch dich.
