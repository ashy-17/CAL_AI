import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const firebaseConfig = window.__FIREBASE_CONFIG__ || {};
if (!firebaseConfig.apiKey) {
    throw new Error('Firebase config missing on window.__FIREBASE_CONFIG__.');
}

const app = initializeApp(firebaseConfig, 'cal-ai-auth');
export const auth = getAuth(app);
