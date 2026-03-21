import { CanvasRenderer } from './components/CanvasRenderer.jsx';
import { DebugPanel } from './components/DebugPanel.jsx';
import { OrientationWarning } from './components/OrientationWarning.jsx';
import { SmallScreenWarning } from './components/SmallScreenWarning.jsx';
import { FullscreenToggle } from './components/FullscreenToggle.jsx';

function App() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
      <CanvasRenderer>
        {({ engineData, calibrating, isBelowMinimum }) => (
          <>
            <DebugPanel engineData={engineData} />
            <SmallScreenWarning isBelowMinimum={isBelowMinimum} />
          </>
        )}
      </CanvasRenderer>

      {/* Global overlays (not scoped to canvas) */}
      <OrientationWarning />
      <FullscreenToggle />
    </div>
  );
}

export default App;
