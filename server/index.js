import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import webpush from 'web-push';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const dataDir = path.join(rootDir, '.data');
const dataFile = path.join(dataDir, 'push-state.json');
const port = Number(process.env.PORT || 4000);
const reminderIntervalMs = Number(process.env.PUSH_CHECK_INTERVAL_MS || 60_000);

const reminderLevels = [
  {
    minutes: 60,
    title: 'LOG YOUR HOUR.',
    body: 'No excuses. What did you just do?',
  },
  {
    minutes: 75,
    title: 'YOU ARE DRIFTING.',
    body: 'Open GRIND and account for the last hour.',
  },
  {
    minutes: 90,
    title: 'AVOIDANCE DETECTED.',
    body: 'Log now or lose the streak momentum.',
  },
  {
    minutes: 120,
    title: 'TWO HOURS UNTRACKED.',
    body: 'You asked for accountability. Move.',
  },
];

const defaultState = {
  subscriptions: [],
  lastLogTime: null,
  sentReminderLevels: [],
};

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn('Web Push disabled: set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.');
}

async function readState() {
  try {
    const rawState = await fs.readFile(dataFile, 'utf8');
    return { ...defaultState, ...JSON.parse(rawState) };
  } catch (error) {
    return { ...defaultState };
  }
}

async function writeState(state) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(state, null, 2));
}

function isValidSubscription(subscription) {
  return Boolean(
    subscription
    && typeof subscription.endpoint === 'string'
    && subscription.keys
    && typeof subscription.keys.p256dh === 'string'
    && typeof subscription.keys.auth === 'string',
  );
}

async function sendReminder(subscription, level) {
  const payload = JSON.stringify({
    title: level.title,
    body: level.body,
    tag: `grind-reminder-${level.minutes}`,
    url: '/',
  });

  await webpush.sendNotification(subscription, payload);
}

async function runReminderCheck() {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  const state = await readState();
  if (!state.lastLogTime || state.subscriptions.length === 0) return;

  const lastLogAt = new Date(state.lastLogTime).getTime();
  if (Number.isNaN(lastLogAt)) return;

  const elapsedMinutes = Math.floor((Date.now() - lastLogAt) / (1000 * 60));
  const dueLevels = reminderLevels.filter((level) => (
    elapsedMinutes >= level.minutes && !state.sentReminderLevels.includes(level.minutes)
  ));

  if (dueLevels.length === 0) return;

  const activeSubscriptions = [...state.subscriptions];

  for (const level of dueLevels) {
    const survivingSubscriptions = [];

    for (const subscription of activeSubscriptions) {
      try {
        await sendReminder(subscription, level);
        survivingSubscriptions.push(subscription);
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          console.warn('Dropping expired push subscription.');
        } else {
          console.error('Push send failed:', error);
          survivingSubscriptions.push(subscription);
        }
      }
    }

    activeSubscriptions.splice(0, activeSubscriptions.length, ...survivingSubscriptions);
    state.sentReminderLevels.push(level.minutes);
  }

  state.subscriptions = activeSubscriptions;
  await writeState(state);
}

const app = express();

app.use(express.json({ limit: '128kb' }));

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    pushConfigured: Boolean(vapidPublicKey && vapidPrivateKey),
  });
});

app.get('/api/push/public-key', (_request, response) => {
  if (!vapidPublicKey) {
    response.status(503).json({ error: 'Push notifications are not configured.' });
    return;
  }

  response.json({ publicKey: vapidPublicKey });
});

app.post('/api/push/subscribe', async (request, response) => {
  if (!vapidPublicKey || !vapidPrivateKey) {
    response.status(503).json({ error: 'Push notifications are not configured.' });
    return;
  }

  const subscription = request.body;
  if (!isValidSubscription(subscription)) {
    response.status(400).json({ error: 'Invalid push subscription.' });
    return;
  }

  const state = await readState();
  const withoutExisting = state.subscriptions.filter((item) => item.endpoint !== subscription.endpoint);
  state.subscriptions = [...withoutExisting, subscription];
  await writeState(state);

  response.status(201).json({ ok: true });
});

app.delete('/api/push/subscribe', async (request, response) => {
  const { endpoint } = request.body || {};
  if (!endpoint) {
    response.status(400).json({ error: 'Missing subscription endpoint.' });
    return;
  }

  const state = await readState();
  state.subscriptions = state.subscriptions.filter((item) => item.endpoint !== endpoint);
  await writeState(state);

  response.json({ ok: true });
});

app.post('/api/push/activity', async (request, response) => {
  const { lastLogTime } = request.body || {};
  const parsedLogTime = new Date(lastLogTime).getTime();

  if (!lastLogTime || Number.isNaN(parsedLogTime)) {
    response.status(400).json({ error: 'Invalid lastLogTime.' });
    return;
  }

  const state = await readState();
  state.lastLogTime = new Date(parsedLogTime).toISOString();
  state.sentReminderLevels = [];
  await writeState(state);

  response.json({ ok: true });
});

app.use(express.static(distDir));

app.get('*', (_request, response) => {
  response.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`GRIND server listening on http://localhost:${port}`);
});

setInterval(() => {
  runReminderCheck().catch((error) => {
    console.error('Reminder scheduler failed:', error);
  });
}, reminderIntervalMs);
