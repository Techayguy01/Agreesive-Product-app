# API & Integration Documentation

GRIND is a local-first PWA with a small Express companion API for Web Push notifications. Productivity data still lives in the browser's Zustand/localforage store, while push subscription state lives on the backend.

## External Dependencies

### 1. Groq API
*   **Purpose:** Analyzes user logs, scores productivity, and generates insights.
*   **Endpoint:** `https://api.groq.com/openai/v1/chat/completions`.
*   **Model:** `llama-3.3-70b-versatile`.
*   **Credentials:** Requires a `GROQ_API_KEY`.

**Expected JSON Response:**
When the app sends a log to Groq, it requests JSON mode and normalizes this response:
```json
{
  "type": "OBJECT",
  "properties": {
    "hourly_score": { "type": "NUMBER", "description": "0-10 score" },
    "effort_category": { "type": "STRING", "description": "Deep Work | Admin | Distraction | Rest" },
    "goal_alignment_pct": { "type": "NUMBER", "description": "0-100" },
    "insight": { "type": "STRING", "description": "1 sharp, aggressive sentence" },
    "warning": { "type": "STRING", "nullable": true },
    "daily_projection": { "type": "STRING", "description": "On track | At risk | Off track" }
  },
  "required": ["hourly_score", "effort_category", "goal_alignment_pct", "insight", "daily_projection"]
}
```

### 2. Web Speech API
*   **Purpose:** Voice-to-text transcription.
*   **Interface:** `window.SpeechRecognition` or `window.webkitSpeechRecognition`.
*   **Credentials:** None required. Relies on browser-level microphone permissions.

### 3. Browser Push Service
*   **Purpose:** Delivers closed-device reminders to mobile browsers/PWAs.
*   **Interface:** Browser `PushManager`, service worker `push` event, and backend `web-push`.
*   **Credentials:** Requires `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` on the backend.

## Internal REST API

### `GET /api/health`
Returns backend health and whether push is configured.

```json
{
  "ok": true,
  "pushConfigured": true
}
```

### `GET /api/push/public-key`
Returns the VAPID public key used by the browser to create a push subscription.

```json
{
  "publicKey": "B..."
}
```

If VAPID keys are missing, returns `503`.

### `POST /api/push/subscribe`
Stores or replaces the current browser's `PushSubscription`.

Request body is the browser subscription object:

```json
{
  "endpoint": "https://...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

### `DELETE /api/push/subscribe`
Removes a subscription from the backend.

```json
{
  "endpoint": "https://..."
}
```

### `POST /api/push/activity`
Reports the latest user log timestamp and resets reminder escalation.

```json
{
  "lastLogTime": "2026-04-15T10:00:00.000Z"
}
```

The backend scheduler uses this timestamp to send reminders at 60, 75, 90, and 120 minutes of inactivity.

## Internal State (Zustand Store)
The core "API" for the frontend components is the Zustand store (`useStore`).

**Key Methods:**
*   `addGoal(goal: Omit<Goal, 'id' | 'created_at'>)`: Adds a new target to the hierarchy.
*   `addHourlyLog(log: Omit<HourlyLog, 'id'>)`: Submits a new log and triggers the streak calculation.
*   `updateHourlyLog(id: string, updates: Partial<HourlyLog>)`: Used to append AI analysis data to a log after the Groq API returns.
*   `updateDailyScore(date: string)`: Recalculates the day's average score and alignment based on all logs for that date.
*   `nukeDatabase()`: Clears the local persisted Zustand state from IndexedDB/localforage.
