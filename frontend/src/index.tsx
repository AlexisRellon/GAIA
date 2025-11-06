import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ComponentShowcase } from './pages/ComponentShowcase';

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
