
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Capacitor } from '@capacitor/core';

// Initialize app
const initApp = () => {
  createRoot(document.getElementById("root")!).render(<App />);
};

// Wait for the device to be ready on mobile, or start immediately on web
if (Capacitor.isNativePlatform()) {
  document.addEventListener('deviceready', initApp, false);
} else {
  initApp();
}
