# local-whisper-web

Browser-only Transkription mit Whisper (transformers.js) und FFmpeg.wasm.

## Vendor-Dateien einrichten (einmalig)

Die FFmpeg-Bibliotheken müssen **lokal** liegen, damit GitHub Pages sie laden kann.
CDN-URLs funktionieren nicht als Worker-Quelle (CORS-Einschränkung).

### Schritt-für-Schritt

```bash
# Im Projektordner ausführen:
mkdir -p vendor/ffmpeg vendor/ffmpeg-util vendor/ffmpeg-core

# @ffmpeg/ffmpeg (ESM)
curl -L "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js"  -o vendor/ffmpeg/index.js
curl -L "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/worker.js" -o vendor/ffmpeg/worker.js

# @ffmpeg/util
curl -L "https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/esm/index.js" -o vendor/ffmpeg-util/index.js

# @ffmpeg/core (WASM – groß, ca. 30 MB)
curl -L "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js"   -o vendor/ffmpeg-core/ffmpeg-core.js
curl -L "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm" -o vendor/ffmpeg-core/ffmpeg-core.wasm
```

### Alternativ: npm

```bash
npm install @ffmpeg/ffmpeg@0.12.10 @ffmpeg/util@0.12.1 @ffmpeg/core@0.12.6
cp node_modules/@ffmpeg/ffmpeg/dist/esm/index.js  vendor/ffmpeg/
cp node_modules/@ffmpeg/ffmpeg/dist/esm/worker.js vendor/ffmpeg/
cp node_modules/@ffmpeg/util/dist/esm/index.js    vendor/ffmpeg-util/
cp node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js   vendor/ffmpeg-core/
cp node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm vendor/ffmpeg-core/
```

## GitHub Pages – Header-Konfiguration

GitHub Pages benötigt spezifische HTTP-Header für SharedArrayBuffer (WASM).
Erstelle eine `_headers`-Datei (nur Netlify) oder nutze einen GitHub Actions Workflow.

Für GitHub Pages: Füge folgende Datei `_headers` hinzu (funktioniert nur mit Netlify):

```
/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
```

Für GitHub Pages selbst: Siehe [coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker).

## Projektstruktur

```
├── index.html
├── app.js
├── styles.css
├── ffmpeg-worker-proxy.js   ← importiert ./vendor/ffmpeg/worker.js (lokal!)
└── vendor/
    ├── ffmpeg/
    │   ├── index.js
    │   └── worker.js
    ├── ffmpeg-util/
    │   └── index.js
    └── ffmpeg-core/
        ├── ffmpeg-core.js
        └── ffmpeg-core.wasm
```
