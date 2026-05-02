import { useState } from 'react';

const PATTERNS = [
  { id: 'none', label: 'None', css: 'none' },
  { id: 'dots', label: 'Dots', css: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)' },
  { id: 'grid', label: 'Grid', css: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)' },
  { id: 'diagonal', label: 'Diagonal', css: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.015) 20px, rgba(255,255,255,0.015) 21px)' },
  { id: 'noise', label: 'Noise', css: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.03\'/%3E%3C/svg%3E")' },
  { id: 'scanlines', label: 'Scan', css: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)' },
];

const SIZES = { dots: '20px 20px', grid: '40px 40px', diagonal: 'auto', noise: '200px 200px', scanlines: 'auto' };

// C26: Opacity slider for patterns
export default function PatternSelector({ value, onChange }) {
  const currentId = typeof value === 'object' ? value?.id : value;
  const currentOpacity = typeof value === 'object' ? (value?.opacity ?? 0.5) : 0.5;
  const [opacity, setOpacity] = useState(currentOpacity);

  const select = (p) => {
    if (p.id === 'none') { onChange(null); return; }
    onChange({ id: p.id, css: p.css, size: SIZES[p.id], opacity });
  };

  const updateOpacity = (val) => {
    setOpacity(val);
    if (currentId && currentId !== 'none') {
      const pat = PATTERNS.find(p => p.id === currentId);
      if (pat) onChange({ id: pat.id, css: pat.css, size: SIZES[pat.id], opacity: val });
    }
  };

  return (
    <div className="pattern-selector">
      <div className="pattern-grid">
        {PATTERNS.map(p => (
          <button key={p.id}
            className={`pattern-btn ${(currentId || 'none') === p.id ? 'active' : ''}`}
            onClick={() => select(p)} title={p.label}>
            <div className="pattern-preview" style={{
              background: p.id === 'none' ? 'var(--bg-2)' : p.css,
              backgroundSize: SIZES[p.id] || 'auto',
            }} />
            <span className="pattern-name">{p.label}</span>
          </button>
        ))}
      </div>
      {currentId && currentId !== 'none' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <span className="prop-label-text" style={{ fontSize: 10, width: 50 }}>Opacity</span>
          <input type="range" min={5} max={100} value={Math.round(opacity * 100)}
            onChange={e => updateOpacity(+e.target.value / 100)} style={{ flex: 1 }}
            aria-label="Pattern opacity" />
          <span className="size-val" style={{ width: 28 }}>{Math.round(opacity * 100)}%</span>
        </div>
      )}
    </div>
  );
}

export { PATTERNS, SIZES };
