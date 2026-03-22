const fs = require('fs');
const path = require('path');
const dir = './src/components';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const p = path.join(dir, file);
  let c = fs.readFileSync(p, 'utf8');

  c = c.replace(/text-white(?![\/\-])/g, 'text-charcoal');
  c = c.replace(/text-white\//g, 'text-charcoal/');
  c = c.replace(/bg-white\//g, 'bg-charcoal/');
  c = c.replace(/border-white\//g, 'border-charcoal/');
  c = c.replace(/bg-\[\#0D0D12\]/g, 'bg-[#FFFFFF]'); 
  c = c.replace(/glass-card/g, 'soft-card');
  c = c.replace(/magnetic-btn/g, 'bubble-btn');
  // Specifically force the Start button text back to white (blue background needs white text)
  c = c.replace(/text-surface font-sans/g, 'text-white font-sans');
  
  // Safely hide the sliding background elements without using complex HTML regex
  c = c.replace(/magnetic-btn-sliding-bg/g, 'hidden');
  
  // Fix hardcoded SVG stroke colors
  c = c.replace(/stroke="rgba\(255,255,255,/g, 'stroke="rgba(30,41,59,');
  // Fix Home tab text string that might have been hit
  
  fs.writeFileSync(p, c);
}

// Update App.jsx explicitly
let appPath = './src/App.jsx';
let appContent = fs.readFileSync(appPath, 'utf8');
appContent = appContent.replace(/<div className="noise-overlay pointer-events-none" aria-hidden="true" \/>/g, '');
appContent = appContent.replace(/text-white\//g, 'text-charcoal/');
appContent = appContent.replace(/text-white(?![\/\-])/g, 'text-charcoal');
appContent = appContent.replace(/glass-card/g, 'soft-card');
fs.writeFileSync(appPath, appContent);

// Update stimulusRenderer.js explicitly
let enginePath = './src/engine/stimulusRenderer.js';
let engine = fs.readFileSync(enginePath, 'utf8');
engine = engine.replace(/const STIMULUS_COLOR = '[^']+';/, "const STIMULUS_COLOR = '#1E293B';");
engine = engine.replace(/clearColor = '#000000'/, "clearColor = '#FDFBF7'");
fs.writeFileSync(enginePath, engine);

console.log('Transform script completed safely.');
