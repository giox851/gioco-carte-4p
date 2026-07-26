import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Rende l'applicazione React all'interno dell'elemento con id="root"
const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("❌ Impossibile trovare l'elemento #root nel file index.html!");
}