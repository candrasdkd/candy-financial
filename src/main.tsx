import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { analytics } from './firebase.ts'
import { logEvent } from 'firebase/analytics'

// Global error tracking for Firebase Analytics
if (analytics) {
  const analyticsInstance = analytics;
  window.addEventListener('error', (event) => {
    logEvent(analyticsInstance, 'exception', {
      description: event.message,
      fatal: false,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logEvent(analyticsInstance, 'exception', {
      description: event.reason?.message || 'Unhandled Rejection',
      fatal: false,
    });
  });
}

// SW registration is handled by UpdatePrompt via useRegisterSW (virtual:pwa-register/react)
// to avoid double registration conflicts.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
