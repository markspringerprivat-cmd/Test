import { FFmpeg } from "./vendor/ffmpeg/index.js";
import { fetchFile, toBlobURL } from "./vendor/ffmpeg-util/index.js";
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";

const MAX_DURATION_SECONDS = 300;
const MAX_FILE_SIZE_BYTES = 250 * 1024 * 1024;

const els = {
  mediaInput: document.querySelector("#mediaInput"),
  fileMeta: document.querySelector("#fileMeta"),
  startButton: document.querySelector("#startButton"),
  downloadTxtButton: document.querySelector("#downloadTxtButton"),
  downloadWavButton: document.querySelector("#downloadWavButton"),
  copyButton: document.querySelector("#copyButton"),
  statusLog: document.querySelector("#statusLog"),
  progressBar: document.querySelector("#progressBar"),
  transcriptOutput: document.querySelector("#transcriptOutput"),
  modelSelect: document.querySelector("#modelSelect"),
  languageSelect: document.querySelector("#languageSelect"),
  normalizeAudio: document.querySelector("#normalizeAudio"),
  useWebGpu: document.querySelector("#useWebGpu"),
};

let selectedFile = null;
let selectedFileDuration = null;
let ffmpeg = null;
let transcriber = null;
let transcriberKey = "";
let lastWavBlob = null;
let lastTranscript = "";

// Browser-only mode: do not allow remote model code. Model weights are still fetched from the model host.
env.allowRemoteModels = true;
env.allowLocalModels = false;

function log(message) {
  const time = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  els.statusLog.textContent += `\n[${time}] ${message}`;
  els.statusLog.scrollTop = els.statusLog.scrollHeight;
}

function resetLog(message = "Bereit.") {
  els.statusLog.textContent = message;
}

function setProgress(value) {
  const safe = Math.max(0, Math.min(100, value));
  els.progressBar.style.width = `${safe}%`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "unbekannt";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s} min`;
}

function isVideo(file) {
  return file.type.startsWith("video/") || /\.(mp4|mov|webm|mkv|avi)$/i.test(file.name);
}

function isAudio(file) {
  return file.type.startsWith("audio/") || /\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(file.name);
}

function getDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const media = document.createElement(isVideo(file) ? "video" : "audio");
    media.preload = "metadata";
    media.onloadedmetadata = () => {
      const duration = media.duration;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    media.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Die Länge der Datei konnte nicht gelesen werden."));
    };
    media.src = url;
  });
}

async function loadFfmpeg() {
  if (ffmpeg) return ffmpeg;

  log("Lade ffmpeg.wasm für lokale Audio-Extraktion…");
  const instance = new FFmpeg();

  instance.on("progress", ({ progress }) => {
    if (Number.isFinite(progress)) setProgress(5 + progress * 35);
  });

  instance.on("log", ({ message }) => {
    if (/error|invalid|failed/i.test(message)) log(`ffmpeg: ${message}`);
  });

  const coreBaseURL = new URL("./vendor/ffmpeg-core", import.meta.url).href;

  await instance.load({
    coreURL: await toBlobURL(`${coreBaseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${coreBaseURL}/ffmpeg-core.wasm`, "application/wasm"),
    workerURL: await toBlobURL(new URL("./ffmpeg-worker-proxy.js", import.meta.url).href, "text/javascript"),
  });

  ffmpeg = instance;
  log("ffmpeg.wasm geladen.");
  return ffmpeg;
}

async function convertToWav(file) {
  const ff = await loadFfmpeg();
  const inputName = `input-${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
  const outputName = "audio-16khz-mono.wav";

  log(isVideo(file) ? "Extrahiere Audiospur lokal aus dem Video…" : "Normalisiere Audio lokal zu WAV…");
  await ff.writeFile(inputName, await fetchFile(file));

  await ff.exec([
    "-i", inputName,
    "-t", String(MAX_DURATION_SECONDS),
    "-vn",
    "-ar", "16000",
    "-ac", "1",
    "-f", "wav",
    outputName,
  ]);

  const data = await ff.readFile(outputName);
  await ff.deleteFile(inputName).catch(() => {});
  await ff.deleteFile(outputName).catch(() => {});

  lastWavBlob = new Blob([data.buffer], { type: "audio/wav" });
  els.downloadWavButton.disabled = false;
  log(`WAV erstellt: ${formatBytes(lastWavBlob.size)}.`);
  return lastWavBlob;
}

async function loadTranscriber() {
  const model = els.modelSelect.value;
  const device = els.useWebGpu.checked ? "webgpu" : "wasm";
  const key = `${model}:${device}`;

  if (transcriber && transcriberKey === key) return transcriber;

  log(`Lade Transkriptionsmodell: ${model} (${device})…`);
  setProgress(45);

  transcriber = await pipeline("automatic-speech-recognition", model, {
    device,
    dtype: device === "webgpu" ? "fp16" : "q4",
    progress_callback: (event) => {
      if (event.status === "progress" && event.progress) {
        setProgress(45 + Math.min(25, event.progress * 0.25));
      }
    },
  });

  transcriberKey = key;
  log("Modell geladen.");
  return transcriber;
}

async function transcribeBlob(audioBlob) {
  const recognizer = await loadTranscriber();
  const audioUrl = URL.createObjectURL(audioBlob);
  const language = els.languageSelect.value;

  log("Starte lokale Transkription…");
  setProgress(72);

  const options = {
    task: "transcribe",
    chunk_length_s: 30,
    stride_length_s: 5,
  };

  if (language !== "auto") {
    options.language = language;
  }

  try {
    const result = await recognizer(audioUrl, options);
    setProgress(100);
    return typeof result === "string" ? result : (result.text ?? "").trim();
  } finally {
    URL.revokeObjectURL(audioUrl);
  }
}

async function handleFileChange() {
  selectedFile = els.mediaInput.files?.[0] ?? null;
  selectedFileDuration = null;
  lastWavBlob = null;
  lastTranscript = "";
  els.transcriptOutput.value = "";
  els.downloadTxtButton.disabled = true;
  els.downloadWavButton.disabled = true;
  els.copyButton.disabled = true;
  els.startButton.disabled = true;
  setProgress(0);
  resetLog("Datei wird geprüft…");

  if (!selectedFile) return;

  try {
    if (!isAudio(selectedFile) && !isVideo(selectedFile)) {
      throw new Error("Bitte wähle eine Audio- oder Videodatei aus.");
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`Die Datei ist zu groß. Limit: ${formatBytes(MAX_FILE_SIZE_BYTES)}.`);
    }

    selectedFileDuration = await getDuration(selectedFile);
    if (selectedFileDuration > MAX_DURATION_SECONDS + 1) {
      throw new Error(`Die Datei ist zu lang. Erlaubt sind maximal ${formatDuration(MAX_DURATION_SECONDS)}.`);
    }

    els.fileMeta.classList.remove("hidden");
    els.fileMeta.innerHTML = `
      <strong>${selectedFile.name}</strong><br>
      Typ: ${selectedFile.type || "unbekannt"} · Größe: ${formatBytes(selectedFile.size)} · Länge: ${formatDuration(selectedFileDuration)}
    `;
    els.startButton.disabled = false;
    resetLog("Datei geprüft. Transkription kann gestartet werden.");
  } catch (error) {
    els.fileMeta.classList.remove("hidden");
    els.fileMeta.innerHTML = `<strong>Fehler:</strong> ${error.message}`;
    resetLog(`Fehler: ${error.message}`);
  }
}

async function startTranscription() {
  if (!selectedFile) return;

  els.startButton.disabled = true;
  els.downloadTxtButton.disabled = true;
  els.copyButton.disabled = true;
  els.transcriptOutput.value = "";
  setProgress(0);
  resetLog("Verarbeitung gestartet.");

  try {
    let audioBlob;

    if (isVideo(selectedFile) || els.normalizeAudio.checked) {
      audioBlob = await convertToWav(selectedFile);
    } else {
      audioBlob = selectedFile;
      lastWavBlob = null;
      els.downloadWavButton.disabled = true;
      log("Nutze die Audiodatei direkt ohne WAV-Normalisierung.");
    }

    lastTranscript = await transcribeBlob(audioBlob);
    els.transcriptOutput.value = lastTranscript || "[Kein Text erkannt]";
    els.downloadTxtButton.disabled = !lastTranscript;
    els.copyButton.disabled = !lastTranscript;
    log("Fertig.");
  } catch (error) {
    const msg = error?.message ?? String(error);
    log(`Fehler: ${msg}`);
    els.transcriptOutput.value = `Fehler: ${msg}`;
  } finally {
    els.startButton.disabled = false;
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadTranscript() {
  if (!lastTranscript) return;
  const blob = new Blob([lastTranscript], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, "transkript.txt");
}

function downloadWav() {
  if (!lastWavBlob) return;
  downloadBlob(lastWavBlob, "audio-16khz-mono.wav");
}

async function copyTranscript() {
  if (!lastTranscript) return;
  await navigator.clipboard.writeText(lastTranscript);
  log("Transkript in die Zwischenablage kopiert.");
}

els.mediaInput.addEventListener("change", handleFileChange);
els.startButton.addEventListener("click", startTranscription);
els.downloadTxtButton.addEventListener("click", downloadTranscript);
els.downloadWavButton.addEventListener("click", downloadWav);
els.copyButton.addEventListener("click", copyTranscript);

if (!("gpu" in navigator)) {
  els.useWebGpu.disabled = true;
  els.useWebGpu.checked = false;
}
