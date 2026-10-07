import {Component, StrictMode, type ErrorInfo, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class NovaErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Nova UI runtime error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        background: '#020617',
        color: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        padding: 24,
      }}>
        <div style={{
          width: 'min(720px, 100%)',
          border: '1px solid #334155',
          background: '#0f172a',
          borderRadius: 12,
          padding: 24,
        }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>Nova UI could not start</h1>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>
            The application hit a client-side runtime error. The message below is shown instead of a blank screen.
          </p>
          <pre style={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            background: '#020617',
            border: '1px solid #1e293b',
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            color: '#fca5a5',
          }}>
            {this.state.error.message || String(this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 12,
              border: 0,
              borderRadius: 8,
              background: '#06b6d4',
              color: '#082f49',
              padding: '9px 14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reload Nova
          </button>
        </div>
      </div>
    );
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('Nova root element is missing');

createRoot(root).render(
  <StrictMode>
    <NovaErrorBoundary>
      <App />
    </NovaErrorBoundary>
  </StrictMode>,
);
