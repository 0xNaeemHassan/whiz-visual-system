import { useState, useEffect } from 'react';

const PRESETS = [
  { name: 'Midnight', value: 'linear-gradient(180deg, #0F1318 0%, #1A1F2E 100%)' },
  { name: 'Deep Ocean', value: 'linear-gradient(180deg, #0A1628 0%, #1A2742 50%, #0F1318 100%)' },
  { name: 'Ember', value: 'linear-gradient(180deg, #1A0A0A 0%, #2D1515 50%, #0F1318 100%)' },
  { name: 'Aurora', value: 'linear-gradient(135deg, #0F1318 0%, #0A1A2E 50%, #1A0F28 100%)' },
  { name: 'Void', value: 'radial-gradient(ellipse at center, #1A1F2E 0%, #0A0D12 100%)' },
  { name: 'Sunset', value: 'linear-gradient(180deg, #1A1020 0%, #2D1A1A 50%, #0F1318 100%)' },
  { name: 'Forest', value: 'linear-gradient(180deg, #0A1A14 0%, #0F1318 100%)' },
  { name: 'Neon', value: 'linear-gradient(135deg, #0F1318 0%, #141A28 50%, #1A1428 100%)' },
];

export default function GradientEditor({ value, onChange, themeBase }) {
  const [mode, setMode] = useState(value?.startsWith('linear') || value?.startsWith('radial') ? 'gradient' : 'solid');
  // Fix #16: sync mode when parent resets value to null
  useEffect(() => {
    if (!value && mode === 'gradient') setMode('solid');
  }, [value]);
  const [angle, setAngle] = useState(180);
  const [stop1, setStop1] = useState(themeBase || '#0F1318');
  // Fix #17: update stop1 when theme changes
  useEffect(() => { if (themeBase) setStop1(themeBase); }, [themeBase]);
  const [stop2, setStop2] = useState('#1A1F2E');

  const applyGradient = (a, s1, s2) => {
    const grad = `linear-gradient(${a}deg, ${s1} 0%, ${s2} 100%)`;
    onChange(grad);
  };

  return (
    <div className="gradient-editor">
      <div className="grad-mode-tabs">
        <button className={`grad-tab ${mode === 'solid' ? 'active' : ''}`}
          onClick={() => { setMode('solid'); onChange(null); }}>Solid</button>
        <button className={`grad-tab ${mode === 'gradient' ? 'active' : ''}`}
          onClick={() => { setMode('gradient'); applyGradient(angle, stop1, stop2); }}>Gradient</button>
      </div>

      {mode === 'gradient' && (
        <>
          <div className="grad-preview" style={{ background: value || `linear-gradient(${angle}deg, ${stop1}, ${stop2})` }} />

          <div className="grad-controls">
            <div className="grad-row">
              <span className="grad-label">Angle</span>
              <input type="range" min={0} max={360} value={angle}
                onChange={e => { setAngle(+e.target.value); applyGradient(+e.target.value, stop1, stop2); }} />
              <span className="grad-val">{angle}°</span>
            </div>

            <div className="grad-row">
              <span className="grad-label">Start</span>
              <div className="grad-swatch" style={{ background: stop1 }}>
                <input type="color" value={stop1}
                  onChange={e => { setStop1(e.target.value); applyGradient(angle, e.target.value, stop2); }} />
              </div>
              <input type="text" value={stop1} className="grad-hex"
                onChange={e => { setStop1(e.target.value); applyGradient(angle, e.target.value, stop2); }} />
            </div>

            <div className="grad-row">
              <span className="grad-label">End</span>
              <div className="grad-swatch" style={{ background: stop2 }}>
                <input type="color" value={stop2}
                  onChange={e => { setStop2(e.target.value); applyGradient(angle, stop1, e.target.value); }} />
              </div>
              <input type="text" value={stop2} className="grad-hex"
                onChange={e => { setStop2(e.target.value); applyGradient(angle, stop1, e.target.value); }} />
            </div>
          </div>

          <div className="grad-presets">
            <div className="grad-label" style={{ marginBottom: 8 }}>Presets</div>
            <div className="grad-presets-grid">
              {PRESETS.map(p => (
                <button key={p.name} className="grad-preset-btn"
                  style={{ background: p.value }}
                  onClick={() => onChange(p.value)}
                  title={p.name}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
