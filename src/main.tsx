import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Nova root element is missing');

const showStartupError = (message: string) => {
  rootElement.innerHTML = `
    <div style="min-height:100vh;background:#020617;color:#e2e8f0;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;padding:24px">
      <div style="width:min(720px,100%);border:1px solid #334155;background:#0f172a;border-radius:12px;padding:24px">
        <h1 style="margin:0;font-size:20px">Nova UI could not start</h1>
        <p style="color:#94a3b8;font-size:13px">A client-side startup error occurred. Nova is showing the error instead of a blank screen.</p>
        <pre style="white-space:pre-wrap;overflow-wrap:anywhere;background:#020617;border:1px solid #1e293b;border-radius:8px;padding:12px;font-size:12px;color:#fca5a5"></pre>
        <button style="margin-top:12px;border:0;border-radius:8px;background:#06b6d4;color:#082f49;padding:9px 14px;font-weight:700;cursor:pointer">Reload Nova</button>
      </div>
    </div>`;
  const pre = rootElement.querySelector('pre');
  if (pre) pre.textContent = message;
  const button = rootElement.querySelector('button');
  button?.addEventListener('click', () => window.location.reload());
};

window.addEventListener('error', (event) => {
  console.error('Nova UI runtime error', event.error || event.message);
  showStartupError(event.error?.message || event.message || 'Unknown client-side error');
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason instanceof Error ? event.reason.message : String(event.reason || 'Unhandled promise rejection');
  console.error('Nova UI unhandled rejection', event.reason);
  if (!rootElement.childElementCount) showStartupError(reason);
});

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
