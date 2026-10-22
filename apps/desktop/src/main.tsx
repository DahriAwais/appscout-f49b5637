import { Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import './styles.css';
class ErrorBoundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: '' };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.error(error);
  }
  render() {
    return this.state.error ? (
      <main className="startup">
        <h1>AppScout could not open</h1>
        <p>{this.state.error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
const root = createRoot(document.getElementById('root')!);
if (!window.scout) {
  root.render(
    <main className="startup">
      <h1>Open AppScout on desktop</h1>
      <p>This renderer needs the Electron desktop data bridge.</p>
    </main>,
  );
} else {
  void import('./App')
    .then(({ default: App }) =>
      root.render(
        <ErrorBoundary>
          <MotionConfig reducedMotion="user">
            <App />
          </MotionConfig>
        </ErrorBoundary>,
      ),
    )
    .catch((error) =>
      root.render(
        <main className="startup">
          <h1>AppScout could not load</h1>
          <p>{error instanceof Error ? error.message : 'Restart the desktop app.'}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </main>,
      ),
    );
}
