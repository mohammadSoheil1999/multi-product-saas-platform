import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { SiteProvider } from './context/SiteContext.jsx';

// ✅ register service worker (PWA requirement)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(() => console.log("✅ Service Worker registered"))
      .catch((err) => console.log("❌ SW error:", err));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SiteProvider><App /></SiteProvider>
  </React.StrictMode>
);
