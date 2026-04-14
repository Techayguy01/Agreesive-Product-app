# Operational Runbook

This document outlines maintenance, monitoring, and emergency procedures for the GRIND application.

## Monitoring & Logs
Since GRIND is a Client-Side Application, there are no traditional backend server logs (e.g., CloudWatch, ELK).
*   **Application Errors:** Viewable in the browser's Developer Tools Console (`F12` -> Console).
*   **Data Inspection:** Viewable in the browser's Application tab (`F12` -> Application -> IndexedDB -> `localforage`).
*   **API Failures:** If the Groq API fails, it is caught in `src/lib/groq.ts` and logged to the browser console as `Groq API Error: [details]`. The UI will gracefully degrade (the log will remain in an "Awaiting AI judgment..." state).

## Emergency Fixes

### Scenario 1: The App Freezes or Fails to Load
*   **Cause:** Corrupted state in IndexedDB or a malformed JSON payload from a previous version.
*   **Resolution:**
    1. Instruct the user to navigate to the **Settings** tab.
    2. Click the red **"Nuke Database"** button.
    3. *Warning:* This is a destructive action that clears all local data.
    4. If the UI is completely inaccessible, instruct the user to open DevTools -> Application -> Storage -> "Clear site data".

### Scenario 2: Microphone Fails to Initialize
*   **Cause:** Browser permission denied, or unsupported browser (e.g., older Firefox).
*   **Resolution:**
    1. Check if the URL is `https://`.
    2. Prompt the user to click the lock icon in the URL bar and allow Microphone access.
    3. If the browser does not support `SpeechRecognition`, the app will show a native `alert()` stating: "Speech recognition is not supported in this browser." The user must fallback to typing.

### Scenario 3: AI Analysis is Stuck
*   **Cause:** Invalid API key, Groq rate limiting, or network disconnection.
*   **Resolution:**
    1. Check the browser console for 401 (Unauthorized) or 429 (Too Many Requests) errors.
    2. Ensure the `GROQ_API_KEY` is valid and has billing enabled if exceeding free tier limits.

## Deployment Pipeline
1.  **Build:** Run `npm run build`. Vite compiles the React application into static HTML/CSS/JS in the `dist/` folder.
2.  **Deploy:** The `dist/` folder can be deployed to any static hosting provider (Vercel, Netlify, Cloudflare Pages, or Google Cloud Storage).
3.  **CI/CD:** In a standard setup, pushing to the `main` branch on GitHub triggers a GitHub Action that runs `npm run build` and deploys the output to the hosting provider.

## Backup & Recovery
Because data is stored locally on the user's device, **there is no centralized backup**.
*   *Future Implementation:* Add an "Export Data" button in Settings that downloads the Zustand state as a `.json` file, and an "Import Data" button to restore it.
