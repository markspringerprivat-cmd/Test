# Lokale Audio- und Video-Transkription

Statische Browser-only-Webseite für GitHub Pages.

## Funktionen

- Audio auswählen: MP3, WAV, M4A, OGG, FLAC, AAC
- Video auswählen: MP4, MOV, WEBM, MKV, AVI
- maximales Limit: 5 Minuten
- lokale Extraktion/Normalisierung zu WAV 16 kHz Mono mit `ffmpeg.wasm`
- lokale Transkription mit `Transformers.js` und Whisper-kompatiblen ONNX-Modellen
- TXT-Download des Transkripts
- optionaler Download der erzeugten WAV-Datei

## Datenschutz

Die ausgewählte Audio- oder Videodatei wird nicht an deinen Server hochgeladen. Die Verarbeitung läuft im Browser.

Hinweis: Die JavaScript-, WASM- und Modell-Dateien werden beim ersten Start von externen CDNs beziehungsweise Hugging Face geladen. Dabei entstehen normale Verbindungsdaten zum jeweiligen Anbieter. Die ausgewählte Medien-Datei wird dabei nicht übertragen.

## Dateien

- `index.html`
- `styles.css`
- `app.js`
- `ffmpeg-worker-proxy.js`

`ffmpeg-worker-proxy.js` ist nötig, wenn die Seite über GitHub Pages läuft. Browser erlauben Worker-Skripte nicht direkt von einem fremden Origin. Der Proxy liegt auf deiner Domain und importiert den eigentlichen ffmpeg.wasm-Worker als ES-Modul.

## Lokaler Test

Nicht per `file://` öffnen. Starte einen lokalen Webserver:

```bash
python3 -m http.server 8000
```

Dann öffnen:

```text
http://localhost:8000
```

## GitHub Pages

Lege die Dateien in dein Repository und aktiviere GitHub Pages für den Branch/Ordner. Die Seite funktioniert ohne Backend.

## Hinweise

- Auf schwachen Smartphones kann die Verarbeitung langsam sein.
- `whisper-tiny` ist schneller, `whisper-base` ist ausgewogener, `whisper-small` ist besser, aber deutlich schwerer.
- Für maximale Datenschutzkontrolle solltest du die verwendeten Bibliotheken, WASM-Dateien und Modelle selbst hosten.
