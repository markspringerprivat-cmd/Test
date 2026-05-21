@echo off
echo ============================================
echo  FFmpeg Vendor-Dateien werden heruntergeladen
echo ============================================
echo.

:: Ordner erstellen
mkdir vendor\ffmpeg 2>nul
mkdir vendor\ffmpeg-util 2>nul
mkdir vendor\ffmpeg-core 2>nul

echo [1/5] ffmpeg/index.js ...
curl -L "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js" -o vendor\ffmpeg\index.js
if errorlevel 1 goto fehler

echo [2/5] ffmpeg/worker.js ...
curl -L "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/worker.js" -o vendor\ffmpeg\worker.js
if errorlevel 1 goto fehler

echo [3/5] ffmpeg-util/index.js ...
curl -L "https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/esm/index.js" -o vendor\ffmpeg-util\index.js
if errorlevel 1 goto fehler

echo [4/5] ffmpeg-core/ffmpeg-core.js ...
curl -L "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js" -o vendor\ffmpeg-core\ffmpeg-core.js
if errorlevel 1 goto fehler

echo [5/5] ffmpeg-core/ffmpeg-core.wasm (grosse Datei, bitte warten) ...
curl -L "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm" -o vendor\ffmpeg-core\ffmpeg-core.wasm
if errorlevel 1 goto fehler

echo.
echo ============================================
echo  Fertig! Alle Dateien wurden heruntergeladen.
echo ============================================
echo.
echo Naechster Schritt: Diese Dateien auf GitHub hochladen.
echo (Den vendor-Ordner in dein Repository pushen)
echo.
pause
exit /b 0

:fehler
echo.
echo FEHLER beim Herunterladen! Bitte Internetverbindung pruefen.
pause
exit /b 1
