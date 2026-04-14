# API & Integration Documentation

GRIND is a client-side application. It does not expose internal REST APIs. Instead, it relies on internal state management and external third-party APIs.

## External Dependencies

### 1. Google Gemini API
*   **Purpose:** Analyzes user logs, scores productivity, and generates insights.
*   **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent` (Handled via `@google/genai` SDK).
*   **Credentials:** Requires a `GEMINI_API_KEY`.

**Expected JSON Schema Response:**
When the app sends a log to Gemini, it strictly enforces this JSON schema response:
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

## Internal State (Zustand Store)
The core "API" for the frontend components is the Zustand store (`useStore`).

**Key Methods:**
*   `addGoal(goal: Omit<Goal, 'id' | 'created_at'>)`: Adds a new target to the hierarchy.
*   `addHourlyLog(log: Omit<HourlyLog, 'id'>)`: Submits a new log and triggers the streak calculation.
*   `updateHourlyLog(id: string, updates: Partial<HourlyLog>)`: Used to append AI analysis data to a log after the Gemini API returns.
*   `updateDailyScore(date: string)`: Recalculates the day's average score and alignment based on all logs for that date.
