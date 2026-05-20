# Lokale Browser-Transkription mit Whisper

Diese Webseite verarbeitet Audio- und Videodateien direkt im Browser:

- Audio-Dateien können direkt transkribiert oder lokal zu WAV normalisiert werden.
- Video-Dateien werden lokal mit `ffmpeg.wasm` zu 16-kHz-Mono-WAV extrahiert.
- Die Transkription läuft lokal mit `Transformers.js` und Whisper-kompatiblen ONNX-Modellen.
- Die ausgewählte Medien-Datei wird nicht an einen eigenen Server hochgeladen.

## Dateien

```text
index.html
styles.css
app.js
README.md
```

## Lokal testen

Öffne die Datei nicht direkt per `file://`, sondern starte einen kleinen lokalen Server:

```bash
python3 -m http.server 8000
```

Danach im Browser öffnen:

```text
http://localhost:8000
```

## Auf GitHub Pages verwenden

1. Dateien in dein Repository kopieren.
2. In GitHub unter `Settings` → `Pages` die gewünschte Quelle aktivieren.
3. Die Seite über die GitHub-Pages-URL öffnen.

## Datenschutz

Die vom Nutzer ausgewählte Audio- oder Videodatei bleibt im Browser. Es werden aber externe JavaScript-, WASM- und Modell-Dateien über CDN/Hugging-Face-Hosting geladen. Dabei können Verbindungsdaten beim jeweiligen Anbieter anfallen. Wenn du maximale Kontrolle möchtest, solltest du diese Dateien selbst hosten und die URLs in `app.js` anpassen.

## Grenzen

- Eingestellt auf maximal 5 Minuten Medienlänge.
- Eingestellt auf maximal 250 MB Dateigröße.
- Auf älteren Smartphones kann die Verarbeitung langsam sein oder wegen Arbeitsspeichergrenzen fehlschlagen.
- WebGPU ist optional und nicht in allen Browsern stabil verfügbar.
- `whisper-small` kann im Browser deutlich langsamer sein als `tiny` oder `base`.

## Wichtige Stellen in `app.js`

- Maximale Dauer: `MAX_DURATION_SECONDS`
- Maximale Dateigröße: `MAX_FILE_SIZE_BYTES`
- Modell-Liste: `<select id="modelSelect">` in `index.html`
- ffmpeg.wasm-CDN: `baseURL` in `loadFfmpeg()`
