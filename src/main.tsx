import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AdminApp from './admin/AdminApp.tsx';
import './index.css';

const rootElement = document.getElementById('root')!;

// Simple hash router for isolated Admin Panel
if (window.location.hash === '#admin') {
  createRoot(rootElement).render(
    <StrictMode>
      <AdminApp />
    </StrictMode>,
  );
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
