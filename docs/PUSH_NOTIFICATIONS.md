# Web Push Notifications

GRIND uses Web Push for aggressive check-in reminders that can reach a mobile device even when the PWA is closed, subject to browser and OS limits.

## How It Works

```text
User enables notifications in Settings
   ↓
Browser asks for notification permission
   ↓
Browser creates a PushSubscription for this device
   ↓
Express backend stores the subscription in .data/push-state.json
   ↓
User logs an entry
   ↓
Frontend POSTs the last log timestamp to /api/push/activity
   ↓
Backend reminder loop checks elapsed idle time
   ↓
Backend sends Web Push at 60, 75, 90, and 120 minutes
   ↓
Mobile OS shows the notification if allowed
```

## Requirements

*   The production site must run on HTTPS.
*   The backend must be running because browsers do not allow a closed website tab to run reliable timers.
*   The device must grant notification permission.
*   On iOS, the site generally needs to be installed to the Home Screen as a PWA before push notifications are available.
*   Mobile OS battery-saving modes can delay notifications. Web Push is reliable enough for reminders, but not exact to the second.

## Environment Variables

Generate VAPID keys:

```bash
npm run push:keys
```

Add these values to the backend environment:

```bash
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:you@example.com"
PORT=4000
```

Optional scheduler tuning:

```bash
PUSH_CHECK_INTERVAL_MS=60000
```

## Running Locally

Terminal 1:

```bash
npm run server
```

Terminal 2:

```bash
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:4000`.

For a production-style local run:

```bash
npm run build
npm start
```

Then open `http://localhost:4000`.

## Reminder Schedule

The backend sends escalating reminders after the last reported log:

*   `60 min`: `LOG YOUR HOUR.`
*   `75 min`: `YOU ARE DRIFTING.`
*   `90 min`: `AVOIDANCE DETECTED.`
*   `120 min`: `TWO HOURS UNTRACKED.`

When the user logs again, `/api/push/activity` updates `lastLogTime` and resets the sent reminder levels.

## Current Scope

This implementation matches the current single-user, local-first app model. The backend stores all subscriptions against one shared reminder stream in `.data/push-state.json`.

For multi-user production use, add authentication and store `lastLogTime`, reminder state, and push subscriptions per user.
