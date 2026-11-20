import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    const hadController = Boolean(navigator.serviceWorker.controller);
    let reloading = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !reloading) {
        reloading = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker
      .register('sw.js')
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch(() => {});
  });
}

const container = document.getElementById('root');
createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
