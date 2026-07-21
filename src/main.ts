import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { startSilentRefreshScheduler } from './api/axios'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// Jika user sudah login (token tersimpan), mulai scheduler auto-refresh
// agar sesi tetap hidup tanpa perlu login ulang
if (localStorage.getItem('auth_token')) {
  startSilentRefreshScheduler()
}

// Register Service Worker for PWA (High Performance Loading)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered successfully:', reg.scope);
        
        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New update available! Please refresh.');
                // Dispatch event for in-app update notification if needed
                window.dispatchEvent(new CustomEvent('pwa-update-available'));
              }
            });
          }
        });
      })
      .catch((err) => {
        console.error('[PWA] Service Worker registration failed:', err);
      });
  });
} else if ('serviceWorker' in navigator && import.meta.env.DEV) {
  // In development, we can still register for testing, or keep it optional.
  // Registering in dev helps verify offline capabilities and maps offline tiles cache locally!
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('[PWA][Dev] Service Worker registered:', reg.scope))
      .catch((err) => console.error('[PWA][Dev] Service Worker registration failed:', err));
  });
}

// Global Intercept for PWA Installation Prompts
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  (window as any).deferredPrompt = e;
  // Notify the app that the PWA is installable
  console.log('[PWA] beforeinstallprompt captured, dispatching pwa-installable event.');
  window.dispatchEvent(new CustomEvent('pwa-installable'));
});