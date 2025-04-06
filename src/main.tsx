
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Capacitor } from '@capacitor/core';

// Log platform for debugging
console.log('Running on platform:', Capacitor.getPlatform());

// Initialize app
const initApp = () => {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("Root element not found");
    return;
  }
  
  createRoot(rootElement).render(<App />);
};

// Wait for the device to be ready on mobile, or start immediately on web
if (Capacitor.isNativePlatform()) {
  document.addEventListener('deviceready', initApp, false);
} else {
  initApp();
}
