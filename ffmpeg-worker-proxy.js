// Same-origin proxy for @ffmpeg/ffmpeg's internal package worker.
// GitHub Pages cannot start a Worker directly from a CDN URL.
// This local module worker imports the real worker module; its own relative
// imports resolve against the CDN module URL.
import "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/worker.js";
