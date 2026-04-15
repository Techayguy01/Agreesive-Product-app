const PUSH_API_BASE = '/api/push';

export type PushStatus = 'unsupported' | 'default' | 'denied' | 'enabled' | 'disabled';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function getNotificationSupportStatus(): PushStatus {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'default') return 'default';

  return 'disabled';
}

export async function getPushSubscriptionStatus(): Promise<PushStatus> {
  const supportStatus = getNotificationSupportStatus();
  if (supportStatus === 'unsupported' || supportStatus === 'denied' || supportStatus === 'default') {
    return supportStatus;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return subscription ? 'enabled' : 'disabled';
}

export async function enableAggressiveNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw new Error('This browser does not support Web Push notifications.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const keyResponse = await fetch(`${PUSH_API_BASE}/public-key`);
  if (!keyResponse.ok) {
    throw new Error('Push server is not configured with VAPID keys.');
  }

  const { publicKey } = await keyResponse.json();
  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription = existingSubscription || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const subscribeResponse = await fetch(`${PUSH_API_BASE}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });

  if (!subscribeResponse.ok) {
    throw new Error('Push server rejected the notification subscription.');
  }
}

export async function disableAggressiveNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await fetch(`${PUSH_API_BASE}/subscribe`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  await subscription.unsubscribe();
}

export async function reportLatestLogActivity(lastLogTime: string) {
  try {
    await fetch(`${PUSH_API_BASE}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastLogTime }),
    });
  } catch (error) {
    console.warn('Push activity sync failed:', error);
  }
}
