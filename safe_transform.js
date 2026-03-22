const fs = require('fs');
const path = require('path');

function replaceAll(str, search, replacement) {
  return str.split(search).join(replacement);
}

const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const p = path.join(dir, file);
  let c = fs.readFileSync(p, 'utf8');

  c = replaceAll(c, 'text-white', 'text-charcoal');
  c = replaceAll(c, 'bg-white', 'bg-charcoal');
  c = replaceAll(c, 'border-white', 'border-charcoal');
  c = replaceAll(c, 'bg-[#0D0D12]', 'bg-[#FFFFFF]');
  c = replaceAll(c, 'glass-card', 'soft-card');
  c = replaceAll(c, 'magnetic-btn', 'bubble-btn');
  
  // Specific fixes
  c = replaceAll(c, 'text-surface font-sans', 'text-white font-sans'); // For start button
  c = replaceAll(c, 'magnetic-btn-sliding-bg', 'hidden'); // Hide sliding component
  c = replaceAll(c, 'stroke="rgba(255,255,255,', 'stroke="rgba(30,41,59,');
  c = replaceAll(c, 'rgba(255,255,255,1)', 'rgba(30,41,59,1)');

  fs.writeFileSync(p, c);
}

// Update App.jsx
let appPath = './src/App.jsx';
let appContent = fs.readFileSync(appPath, 'utf8');
appContent = replaceAll(appContent, '<div className="noise-overlay pointer-events-none" aria-hidden="true" />', '');
appContent = replaceAll(appContent, 'text-white', 'text-charcoal');
appContent = replaceAll(appContent, 'glass-card', 'soft-card');
fs.writeFileSync(appPath, appContent);

// Update engine
let enginePath = './src/engine/stimulusRenderer.js';
let engine = fs.readFileSync(enginePath, 'utf8');
engine = replaceAll(engine, "const STIMULUS_COLOR = '#b0b0b0';", "const STIMULUS_COLOR = '#1E293B';");
engine = replaceAll(engine, "clearColor = '#000000'", "clearColor = '#FDFBF7'");
fs.writeFileSync(enginePath, engine);

console.log('Safe transform completed successfully.');
