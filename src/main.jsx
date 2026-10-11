import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@fontsource-variable/onest';
import '@fontsource-variable/geist-mono';
import './styles/fonts.css';
import './styles/global.css';

// Links from the old hash-router version (/#/new, /#/?q=video) → clean URLs.
if (window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', import.meta.env.BASE_URL + window.location.hash.slice(2));
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
