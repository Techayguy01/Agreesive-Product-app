# Operational Runbook

This document outlines maintenance, monitoring, and emergency procedures for the GRIND application.

## Monitoring & Logs
GRIND is a local-first PWA with a small Express backend for Web Push reminders.
*   **Application Errors:** Viewable in the browser's Developer Tools Console (`F12` -> Console).
*   **Data Inspection:** Viewable in the browser's Application tab (`F12` -> Application -> IndexedDB -> `localforage`).
*   **API Failures:** If the Groq API fails, it is caught in `src/lib/groq.ts` and logged to the browser console as `Groq API Error: [details]`. The UI will gracefully degrade (the log will remain in an "Awaiting AI judgment..." state).
*   **Push Server Logs:** Viewable in the terminal or host logs for `npm run server` / `npm start`.
*   **Push State:** Stored on the backend in `.data/push-state.json`.

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

### Scenario 4: Mobile Notifications Do Not Arrive
*   **Cause:** Push permission denied, VAPID keys missing, backend offline, PWA not installed on iOS, or OS battery-saving delays.
*   **Resolution:**
    1. Ensure `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` are set on the backend.
    2. Run `npm run server` locally, or confirm the deployed backend is healthy at `/api/health`.
    3. In Settings, confirm **Aggressive Mobile Reminders** status is `enabled`.
    4. On iOS, install the site to the Home Screen and enable notification permission from the PWA.
    5. Check `.data/push-state.json` for at least one saved subscription and a recent `lastLogTime`.
    6. Remember that Web Push is not exact to the second; mobile OS policies may delay delivery.

## Deployment Pipeline
1.  **Generate Push Keys:** Run `npm run push:keys` once and set the VAPID environment variables on the backend host.
2.  **Build:** Run `npm run build`. Vite compiles the React application into static HTML/CSS/JS in the `dist/` folder.
3.  **Serve:** Run `npm start`. The Express server exposes `/api/*` and serves the built PWA from `dist/`.
4.  **Deploy:** Use a host that can run the Node server, not only static hosting, if closed-device Web Push reminders are required.
5.  **CI/CD:** In a standard setup, pushing to the `main` branch triggers a build and deploys the Node service with the `dist/` output.

## Backup & Recovery
Because data is stored locally on the user's device, **there is no centralized backup**.
*   *Future Implementation:* Add an "Export Data" button in Settings that downloads the Zustand state as a `.json` file, and an "Import Data" button to restore it.
