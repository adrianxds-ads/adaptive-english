# Adaptive English · fixed app

This folder is the permanent GitHub Pages app. Upload all files to the root of the repository `adrianxds-ads/adaptive-english`.

## One-time GitHub setup
1. Upload these files to the repository root: `index.html`, `manifest.webmanifest`, `service-worker.js`, `version.json`, `icon-192.png`, `icon-512.png`.
2. In the repository open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch **main** and folder **/(root)**, then **Save**.
5. The permanent app address will be: `https://adrianxds-ads.github.io/adaptive-english/`.
6. Open that address in Chrome on Android → menu → **Add to Home screen / Install app**.

From then on, only the repository files are updated. The phone icon stays the same.

## Update contract for future levels
For each new LEVEL, replace `index.html` and update `version.json`. Also change `window.ADAPTIVE_APP_BUILD` inside `index.html` to the same new build value. The app checks `version.json` with cache disabled and forces a fresh load when a new build is available.
