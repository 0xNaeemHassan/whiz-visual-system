import { useState } from 'react';

const SCALE = [
  { pt: 84, role: 'Hero Number', usage: 'Big stat callout, 84pt', font: 'Space Grotesk 700' },
  { pt: 56, role: 'Title', usage: 'Frame title, main headline', font: 'Space Grotesk 700' },
  { pt: 36, role: 'Display', usage: 'Section stats, large numbers', font: 'Space Grotesk 700' },
  { pt: 24, role: 'Subheading', usage: 'Card titles, module headers', font: 'Space Grotesk 600' },
  { pt: 18, role: 'Deck / Lead', usage: 'Subtitle, deck line (italic)', font: 'Inter 400 italic' },
  { pt: 14, role: 'Body', usage: 'Paragraphs, descriptions', font: 'Inter 400' },
  { pt: 12, role: 'Secondary', usage: 'Captions, table cells', font: 'Inter 500' },
  { pt: 10, role: 'Label', usage: 'Tags, metadata, ticker items', font: 'JetBrains Mono 400' },
];

const FONTS = [
  { name: 'Space Grotesk', role: 'Display', usage: 'Titles, big numbers, section heads', weights: ['300','400','500','600','700'], sample: 'The DeFi Alpha Desk', mono: false },
  { name: 'Inter', role: 'Body', usage: 'All paragraphs, table cells, captions', weights: ['300','400','500','600'], sample: 'Smart contract risk never fully disappears. Three protocols lost over $2B in exploits last quarter alone.', mono: false },
  { name: 'JetBrains Mono', role: 'Mono', usage: 'Ticker, slug block, footer, code, data tags', weights: ['400','600'], sample: 'WHIZ.DEFI \u25B8 ISSUE 047 \u25B8 YIELD DESK \u25B8 ALPHA LOCKED \u25B8', mono: true },
];

const PAIRS = [
  { desc: 'Title + Deck', element1: { text: 'THE STABLECOIN WAR', font: 'Space Grotesk', size: 36, weight: 700 }, element2: { text: 'Why three protocols are fighting for the same $50B market \u2014 and who wins.', font: 'Inter', size: 14, weight: 400, italic: true } },
  { desc: 'Section Header + Body', element1: { text: 'RISK ANALYSIS', font: 'JetBrains Mono', size: 11, weight: 600 }, element2: { text: 'Decentralized stablecoins face a fundamental tension between capital efficiency and peg stability.', font: 'Inter', size: 13, weight: 400 } },
  { desc: 'Big Stat + Label', element1: { text: '$47B', font: 'Space Grotesk', size: 48, weight: 700 }, element2: { text: 'TOTAL DeFi TVL', font: 'JetBrains Mono', size: 9, weight: 400 } },
];

export default function Typography({ activeTheme }) {
  const [previewText, setPreviewText] = useState('The DeFi Alpha Desk \u2014 Research & Analysis');
  const [previewSize, setPreviewSize] = useState(36);
  const [previewFont, setPreviewFont] = useState('Space Grotesk');
  const [previewWeight, setPreviewWeight] = useState(700);
  // H2: Dark/light background toggle
  const [previewBg, setPreviewBg] = useState('dark');

  const fontFamily = (name) => name.includes('JetBrains') ? "'JetBrains Mono',monospace" : name.includes('Space') ? "'Space Grotesk',sans-serif" : "'Inter',sans-serif";

  return (
    <>
      <div className="page-header">
        <div className="page-title">Typography System</div>
        <div className="page-desc">Three fonts. Eight sizes. No exceptions.</div>
      </div>

      {/* Type Scale */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="font-mono text-xs" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>The 8-Size Quantized Scale</div>
        <div className="type-scale-demo">
          {SCALE.map(s => (
            <div key={s.pt} className="type-scale-row">
              <span className="type-scale-size">{s.pt}pt</span>
              <span className="type-scale-role">{s.role}</span>
              <span style={{
                fontFamily: fontFamily(s.font),
                fontSize: Math.min(s.pt, 36), // Fix #48: show up to 36px so scale differences are visible
                fontWeight: s.font.includes('700') ? 700 : s.font.includes('600') ? 600 : 400,
                fontStyle: s.font.includes('italic') ? 'italic' : 'normal',
                color: s.pt >= 36 ? activeTheme.accent : 'var(--text)',
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{s.usage}</span>
              <span style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--dim)', flexShrink: 0 }}>{s.font}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Font Specimens */}
      <div className="font-showcase">
        {FONTS.map(f => (
          <div key={f.name} className="font-card">
            <div className="font-card-header">
              <div>
                <span className="font-card-name">{f.name}</span>
                <span style={{ marginLeft: 8, fontFamily: 'var(--font-m)', fontSize: 9, color: activeTheme.accent, padding: '2px 6px', background: `${activeTheme.accent}15`, borderRadius: 10 }}>ROLE: {f.role.toUpperCase()}</span>
              </div>
              <span className="font-card-meta">{f.usage}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              {f.weights.map(w => (
                <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'center', minWidth: 60 }}>
                  <div style={{ fontFamily: fontFamily(f.name), fontWeight: parseInt(w), fontSize: 18, color: 'var(--text)', lineHeight: 1 }}>Aa</div>
                  <div style={{ fontFamily: 'var(--font-m)', fontSize: 8, color: 'var(--dim)', marginTop: 4 }}>Weight {w}</div>
                </div>
              ))}
            </div>
            <div style={{
              fontFamily: fontFamily(f.name),
              fontSize: f.mono ? 13 : f.name === 'Space Grotesk' ? 24 : 14,
              fontWeight: f.mono ? 400 : f.name === 'Space Grotesk' ? 700 : 400,
              color: f.mono ? activeTheme.accent : 'var(--text)',
              lineHeight: f.name === 'Inter' ? 1.7 : 1.2,
              borderTop: '1px solid var(--border)', paddingTop: 14,
            }}>{f.sample}</div>
          </div>
        ))}
      </div>

      {/* H3: Pairing examples with mini-frame context */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="font-mono text-xs" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Typographic Pairing in Context</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {PAIRS.map((pair, i) => (
            <div key={i} style={{ padding: 16, background: i === 2 ? activeTheme.base : 'var(--bg-3)', borderRadius: 'var(--r)', border: `1px solid ${i === 2 ? activeTheme.accent + '20' : 'var(--border)'}`, position: 'relative' }}>
              {/* Mini spine for context */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: activeTheme.accent, borderRadius: 'var(--r) 0 0 var(--r)' }} />
              <div style={{ paddingLeft: 12 }}>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--dim)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{pair.desc}</div>
                <div style={{
                  fontFamily: fontFamily(pair.element1.font), fontSize: pair.element1.size, fontWeight: pair.element1.weight,
                  color: i === 2 ? activeTheme.accent : 'var(--text)', lineHeight: 1.1, marginBottom: 8,
                  letterSpacing: pair.element1.font.includes('Mono') ? '0.08em' : (i === 0 ? '-0.01em' : 'normal'),
                  textTransform: pair.element1.font.includes('Mono') ? 'uppercase' : 'none',
                }}>{pair.element1.text}</div>
                <div style={{
                  fontFamily: fontFamily(pair.element2.font), fontSize: pair.element2.size, fontWeight: pair.element2.weight,
                  fontStyle: pair.element2.italic ? 'italic' : 'normal',
                  color: pair.element2.font.includes('Mono') ? 'var(--dim)' : 'var(--muted)', lineHeight: 1.6,
                  textTransform: pair.element2.font.includes('Mono') ? 'uppercase' : 'none',
                  letterSpacing: pair.element2.font.includes('Mono') ? '0.08em' : 'normal',
                }}>{pair.element2.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* H1: Live Preview — uncapped size, H2: dark/light toggle */}
      <div className="card">
        <div className="font-mono text-xs" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Live Type Preview</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Font</label>
            <select value={previewFont} onChange={e => setPreviewFont(e.target.value)}>
              <option>Space Grotesk</option><option>Inter</option><option>JetBrains Mono</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Size (pt)</label>
            <select value={previewSize} onChange={e => setPreviewSize(Number(e.target.value))}>
              {[10,12,14,18,24,36,56,84].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Weight</label>
            <select value={previewWeight} onChange={e => setPreviewWeight(Number(e.target.value))}>
              {[300,400,500,600,700].map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Background</label>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className={`ww-btn ${previewBg==='dark'?'on':''}`} onClick={() => setPreviewBg('dark')} style={{ flex: 1, fontSize: 10, padding: '4px 6px' }}>Dark</button>
              <button className={`ww-btn ${previewBg==='light'?'on':''}`} onClick={() => setPreviewBg('light')} style={{ flex: 1, fontSize: 10, padding: '4px 6px' }}>Light</button>
            </div>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">Text</label>
          <input value={previewText} onChange={e => setPreviewText(e.target.value)} />
        </div>
        <div style={{
          padding: '24px 20px', borderRadius: 'var(--r)', border: '1px solid var(--border)',
          background: previewBg === 'light' ? '#F4F5F7' : 'var(--bg)',
          fontFamily: fontFamily(previewFont),
          fontSize: previewSize, fontWeight: previewWeight, /* H1: No cap */
          color: previewBg === 'light' ? (previewSize >= 36 ? '#1A1F2E' : '#2D3748') : (previewSize >= 36 ? activeTheme.accent : 'var(--text)'),
          lineHeight: 1.2, wordBreak: 'break-word', overflow: 'hidden',
        }}>{previewText}</div>
        <div style={{ marginTop: 10, fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--dim)' }}>
          {previewFont} \u00B7 {previewSize}pt \u00B7 Weight {previewWeight} \u00B7 Rendering at actual size
        </div>
      </div>
    </>
  );
}
