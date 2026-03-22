import { Component } from 'react';
import { CanvasRenderer } from './components/CanvasRenderer.jsx';
import { DebugPanel } from './components/DebugPanel.jsx';
import { OrientationWarning } from './components/OrientationWarning.jsx';
import { SmallScreenWarning } from './components/SmallScreenWarning.jsx';
import { FullscreenToggle } from './components/FullscreenToggle.jsx';
import { TrainingApp } from './components/TrainingApp.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Cognify error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-background flex items-center justify-center px-4">
          <div className="bg-surface-container-lowest rounded-xl px-8 py-8 max-w-sm flex flex-col items-center gap-6 shadow-xl animate-in">
            <span className="material-symbols-outlined text-error text-5xl">error</span>
            <h2 className="font-headline text-xl font-bold text-on-surface text-center">
              Something went wrong
            </h2>
            <p className="text-on-surface-variant text-base text-center">
              An unexpected error occurred. Your training data is safe.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-8 py-4 rounded-xl bg-primary text-on-primary font-bold text-lg
                         active:scale-95 transition-transform duration-200 cursor-pointer
                         shadow-[0_4px_20px_rgba(74,124,89,0.2)]"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">

        <CanvasRenderer>
          {({ engineData, calibrating, isBelowMinimum, renderRef }) => (
            <>
              <DebugPanel engineData={engineData} />
              <SmallScreenWarning isBelowMinimum={isBelowMinimum} />
              <TrainingApp engineData={engineData} renderRef={renderRef} />
            </>
          )}
        </CanvasRenderer>

        {/* Global overlays (not scoped to canvas) */}
        <OrientationWarning />
        <FullscreenToggle />
      </div>
    </ErrorBoundary>
  );
}

export default App;
