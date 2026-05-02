const RATIOS = [
  { id: '4:5', label: '4:5', desc: 'Instagram', w: 1080, h: 1350 },
  { id: '1:1', label: '1:1', desc: 'Square', w: 1080, h: 1080 },
  { id: '16:9', label: '16:9', desc: 'Twitter/OG', w: 1200, h: 675 },
  { id: '9:16', label: '9:16', desc: 'Stories', w: 1080, h: 1920 },
];

export default function AspectRatioSelector({ value, onChange }) {
  return (
    <div className="aspect-selector">
      {RATIOS.map(r => (
        <button
          key={r.id}
          className={`aspect-btn ${value === r.id ? 'active' : ''}`}
          onClick={() => onChange(r)}
          title={`${r.w}×${r.h}`}
        >
          <div className="aspect-preview" style={{
            width: r.id === '9:16' ? 12 : r.id === '16:9' ? 24 : r.id === '1:1' ? 16 : 14,
            height: r.id === '9:16' ? 21 : r.id === '16:9' ? 14 : r.id === '1:1' ? 16 : 18,
            border: '1.5px solid currentColor',
            borderRadius: 2,
          }} />
          <span className="aspect-label">{r.label}</span>
          <span className="aspect-desc">{r.desc}</span>
        </button>
      ))}
    </div>
  );
}

export { RATIOS };
