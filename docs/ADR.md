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

## ADR 3: Gemini 3 Flash Preview for AI Analysis
**Date:** April 2026
**Context:** We need an LLM to analyze logs, score them, and provide aggressive feedback.
**Decision:** We selected `gemini-3-flash-preview` using the `@google/genai` SDK with strict JSON Schema enforcement.
**Consequences:**
*   *Pros:* Extremely fast response times (crucial for a fluid logging experience), native support for structured JSON output guarantees the UI won't break parsing the response.
*   *Cons:* The prompt must include all context (recent logs, goals) every time, which increases token usage per request.

## Future Roadmap & Technical Debt
1.  **Sync Engine:** The app is currently bound to a single browser. We need to implement a CRDT-based sync engine (e.g., Yjs or ElectricSQL) to allow cross-device usage.
2.  **Timezone Handling:** Currently relying on `date-fns` and local browser time. If a user travels across timezones, the "Daily Score" boundaries might skew.
3.  **PWA Manifest:** Add a proper `manifest.json` and Service Worker to allow users to install GRIND on their mobile home screens for native-like access.
