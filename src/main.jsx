import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initPWA } from '@/utils/pwa'

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
)

// Initialize PWA features after app loads
if (typeof window !== 'undefined') {
  initPWA();
} 