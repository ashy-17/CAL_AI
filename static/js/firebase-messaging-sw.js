/**
 * Cal AI – Firebase Messaging Service Worker
 *
 * This file MUST be served from the root scope ("/firebase-messaging-sw.js").
 * The Flask route in app.py serves it at that path.
 *
 * Responsibilities:
 *   1. Handle background push messages from FCM when the app is closed/hidden.
 *   2. Show native OS notifications with action buttons.
 *   3. Route notification clicks to the correct page.
 *
 * NOTE: The foreground (in-app) message handler lives in app.js using
 *       onMessage() from the Firebase JS SDK.
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// ── Firebase config ───────────────────────────────────────────────────────────
// __FIREBASE_CONFIG__ is replaced at deploy time by your actual config object,
// OR you can hard-code it here.  The SW has no access to window / DOM.
// To inject dynamically, use a build step or store it in a self.firebaseConfig
// variable you importScripts from a generated /static/js/firebase-config.js.
//
// Quick option: hard-code your config here (safe — these values are public):
//
//   firebase.initializeApp({
//     apiKey:            "AIza...",
//     authDomain:        "your-app.firebaseapp.com",
//     projectId:         "your-app",
//     storageBucket:     "your-app.appspot.com",
//     messagingSenderId: "123456789",
//     appId:             "1:123...:web:abc...",
//   });
//
// Dynamic option: load from a generated JS file served by Flask:
//   importScripts('/static/js/firebase-config.js');  // sets self.FIREBASE_CONFIG
//   firebase.initializeApp(self.FIREBASE_CONFIG);

// ── REPLACE THIS BLOCK with your actual Firebase project config ───────────────
firebase.initializeApp({
  apiKey:            self.FIREBASE_API_KEY            || '__FIREBASE_API_KEY__',
  authDomain:        self.FIREBASE_AUTH_DOMAIN        || '__FIREBASE_AUTH_DOMAIN__',
  projectId:         self.FIREBASE_PROJECT_ID         || '__FIREBASE_PROJECT_ID__',
  storageBucket:     self.FIREBASE_STORAGE_BUCKET     || '__FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID|| '__FIREBASE_MESSAGING_SENDER_ID__',
  appId:             self.FIREBASE_APP_ID             || '__FIREBASE_APP_ID__',
});
// ─────────────────────────────────────────────────────────────────────────────

const messaging = firebase.messaging();

// ── Background message handler ────────────────────────────────────────────────
// Fires when a push arrives while the page is NOT in the foreground.
// FCM delivers data-only messages here; notification messages are shown
// automatically by the browser — this handler lets us customise them.
messaging.onBackgroundMessage(payload => {
  const data    = payload.data || {};
  const notif   = payload.notification || {};
  const title   = notif.title || data.title || '🥗 Cal AI';
  const body    = notif.body  || data.body  || 'Time to log your meal!';
  const icon    = notif.icon  || data.icon  || '/static/icons/icon-192.png';
  const destUrl = data.url    || notif.click_action || '/dashboard';

  return self.registration.showNotification(title, {
    body,
    icon,
    badge:             '/static/icons/icon-72.png',
    vibrate:           [300, 100, 300, 100, 300],
    tag:               'cal-ai-' + Date.now(),   // unique tag → all reminders appear
    renotify:          false,
    requireInteraction: false,
    data:              { url: destUrl },
    actions: [
      { action: 'log',   title: '✏️ Log Food'  },
      { action: 'scan',  title: '📷 Scan Food' },
      { action: 'close', title: '✕ Dismiss'    },
    ],
  });
});

// ── Notification click handler ─────────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  let url = '/dashboard';
  if (e.action === 'scan')                    url = '/scan';
  else if (e.action === 'log')                url = '/log';
  else if (e.notification.data?.url)          url = e.notification.data.url;
  else if (e.action === 'close')              return;   // just dismiss

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      const existing = cs.find(c => c.url.includes(self.registration.scope));
      if (existing) return existing.focus().then(c => c.navigate(url));
      return clients.openWindow(url);
    })
  );
});
