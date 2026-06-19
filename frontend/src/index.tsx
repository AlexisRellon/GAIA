import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ComponentShowcase } from './pages/ComponentShowcase';
// PWA-01: Register Service Worker for offline tile caching + background sync
import { registerSW } from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Simple client-side routing for development
const path = window.location.pathname;

root.render(
  <React.StrictMode>
    {path === '/showcase' ? <ComponentShowcase /> : <App />}
  </React.StrictMode>
);

// PWA-01: Register SW after React has mounted (production only)
registerSW();
