import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// SW registration is handled by UpdatePrompt via useRegisterSW (virtual:pwa-register/react)
// to avoid double registration conflicts.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
