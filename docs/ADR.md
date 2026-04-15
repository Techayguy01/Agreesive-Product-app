# Architectural Decision Records (ADRs)

## ADR 1: Local-First Storage Architecture
**Date:** April 2026
**Context:** The app needs to store highly personal productivity data, sleep schedules, and goals.
**Decision:** We chose a completely local-first architecture using `Zustand` combined with `localforage` (IndexedDB) rather than a cloud database like Firebase or PostgreSQL.
**Consequences:**
*   *Pros:* Zero latency for UI updates, complete user privacy, offline capability, no database hosting costs.
*   *Cons:* Data cannot easily be synced across multiple devices (phone + laptop) without building a custom export/import or sync layer later.

## ADR 2: Native Web Speech API vs. Cloud STT (Whisper)
**Date:** April 2026
**Context:** The user requested voice-to-text capabilities for quick logging.
**Decision:** We implemented the native browser `Web Speech API` instead of integrating a cloud service like OpenAI Whisper or Google Cloud Speech-to-Text.
**Consequences:**
*   *Pros:* Zero API cost, near-zero latency (processes locally/via browser's built-in engine), no audio files need to be uploaded.
*   *Cons:* Accuracy depends heavily on the user's browser (Chrome is excellent, others vary). It does not work well in noisy environments compared to Whisper.

## ADR 3: Groq Llama 3.3 70B Versatile for AI Analysis
**Date:** April 2026
**Context:** We need an LLM to analyze logs, score them, and provide aggressive feedback.
**Decision:** We selected Groq's `llama-3.3-70b-versatile` model using the OpenAI-compatible Chat Completions API with JSON mode.
**Consequences:**
*   *Pros:* Fast response times are a good fit for quick hourly logging, and JSON mode keeps parsing predictable.
*   *Cons:* The prompt must include all context (recent logs, goals) every time, which increases token usage per request. The browser-based API key is visible in built client code, so a small backend proxy would be safer for a public deployment.

## ADR 4: Web Push Backend for Closed-Device Reminders
**Date:** April 2026
**Context:** The user needs aggressive reminders when the mobile device is locked or the PWA is closed. Browser timers cannot reliably run after a mobile tab is suspended.
**Decision:** We added a small Express backend using Web Push and VAPID keys. The frontend registers a browser `PushSubscription`, reports the latest log timestamp, and the backend sends escalating reminders after idle windows.
**Consequences:**
*   *Pros:* Keeps the app as a web/PWA product, avoids app stores, and supports closed-device notification delivery when the browser/OS permits it.
*   *Cons:* Requires a running backend, HTTPS in production, notification permission, and OS/browser support. iOS generally requires installing the PWA to the Home Screen. Delivery timing may be delayed by mobile battery policies.

## Future Roadmap & Technical Debt
1.  **Sync Engine:** The app is currently bound to a single browser. We need to implement a CRDT-based sync engine (e.g., Yjs or ElectricSQL) to allow cross-device usage.
2.  **Timezone Handling:** Currently relying on `date-fns` and local browser time. If a user travels across timezones, the "Daily Score" boundaries might skew.
3.  **API Key Proxy:** Move Groq calls behind a small serverless endpoint before any public deployment.
4.  **Push User Accounts:** Push state is currently single-user. Add authentication before supporting multiple users/devices with independent reminder schedules.
