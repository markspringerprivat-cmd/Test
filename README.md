# Lokale Browser-Transkription mit Whisper

Diese statische Webseite verarbeitet Audio- und Videodateien lokal im Browser.

## Funktionen

- Audio-Upload: MP3, WAV, M4A, OGG, FLAC, AAC
- Video-Upload: MP4, MOV, WEBM, MKV, AVI
- Maximale Länge: 5 Minuten
- Lokale Audio-Extraktion/Normalisierung mit `ffmpeg.wasm`
- Lokale Transkription mit `Transformers.js` und Whisper-Modellen
- TXT-Download des Transkripts
- WAV-Download der lokal extrahierten Audiospur

## Datenschutz

Die ausgewählte Audio- oder Videodatei wird nicht an einen Server hochgeladen. Die Verarbeitung der Mediendatei läuft im Browser.

Hinweis: Die Whisper-Modelle werden weiterhin über Hugging Face/CDN geladen, sofern sie nicht separat selbst gehostet werden. Die Mediendatei selbst wird dabei nicht übertragen.

## GitHub Pages

Alle ffmpeg-Dateien liegen im Ordner:

```text
vendor/
├─ ffmpeg/
├─ ffmpeg-core/
└─ ffmpeg-util/
```

Diese Ordner müssen zusammen mit `index.html`, `styles.css` und `app.js` ins Repository hochgeladen werden. Dadurch wird der ffmpeg-Worker von derselben GitHub-Pages-Domain geladen und nicht mehr direkt von einem CDN.

## Lokal testen

```bash
python3 -m http.server 8000
```

Dann öffnen:

```text
http://localhost:8000
```

## Wichtige Hinweise

- Nicht per `file://` öffnen. Verwende einen lokalen Webserver oder GitHub Pages.
- Beim ersten Start müssen die Whisper-Modelle geladen werden. Das kann dauern.
- Auf schwachen Smartphones kann Video-Konvertierung langsam sein oder an Speichergrenzen stoßen.
