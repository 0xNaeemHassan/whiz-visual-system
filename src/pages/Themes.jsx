
// M-07: Curated font pairings for DeFi visual content
const FONT_PAIRINGS = [
  { id: 'default', name: 'Space Grotesk + Inter', heading: "'Space Grotesk', sans-serif", body: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" },
  { id: 'editorial', name: 'Playfair + Source Sans', heading: "'Playfair Display', serif", body: "'Source Sans 3', sans-serif", mono: "'Fira Code', monospace" },
  { id: 'modern', name: 'Outfit + DM Sans', heading: "'Outfit', sans-serif", body: "'DM Sans', sans-serif", mono: "'DM Mono', monospace" },
  { id: 'minimal', name: 'Geist + Geist Mono', heading: "'Geist', sans-serif", body: "'Geist', sans-serif", mono: "'Geist Mono', monospace" },
  { id: 'display', name: 'Syne + IBM Plex', heading: "'Syne', sans-serif", body: "'IBM Plex Sans', sans-serif", mono: "'IBM Plex Mono', monospace" },
];

import { useState } from 'react';
import { THEMES, DEFAULT_THEME } from '../data/themes';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function Themes({ activeTheme, setActiveTheme, showToast }) {
  const [activeFontPairing, setActiveFontPairing] = useState(FONT_PAIRINGS[0]);
  // G3: Custom theme creation
  const [customThemes, setCustomThemes] = useLocalStorage('whiz-custom-themes', []);
  const [showCreate, setShowCreate] = useState(false);
  const [newTheme, setNewTheme] = useState({ name: '', accent: '#6FA8FF', base: '#0B1A3A', useFor: '' });

  const allThemes = [...THEMES, ...customThemes];

  const createTheme = () => {
    if (!newTheme.name.trim()) { showToast('Name is required', 'error'); return; }
    const t = { ...newTheme, id: `custom_${Date.now()}`, custom: true };
    setCustomThemes(prev => [...prev, t]);
    setActiveTheme(t);
    showToast(`Created theme "${t.name}"`);
    setShowCreate(false);
    setNewTheme({ name: '', accent: '#6FA8FF', base: '#0B1A3A', useFor: '' });
  };

  const [deleteConfirmTheme, setDeleteConfirmTheme] = useState(null);
  const deleteCustom = (id) => {
    setDeleteConfirmTheme(id);
  };
  const confirmDeleteTheme = () => {
    const id = deleteConfirmTheme;
    setCustomThemes(prev => prev.filter(t => t.id !== id));
    if (activeTheme.id === id) setActiveTheme(DEFAULT_THEME);
    showToast('Theme deleted', 'info');
    setDeleteConfirmTheme(null);
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">Color Themes</div>

      {/* M-07: Font Pairing Selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Typography Pairing</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {FONT_PAIRINGS.map(fp => (
            <div key={fp.id}
              onClick={() => setActiveFontPairing(fp)}
              style={{
                padding: '10px 12px', cursor: 'pointer', borderRadius: 'var(--r)',
                border: `1px solid ${activeFontPairing.id === fp.id ? 'var(--accent)' : 'var(--border)'}`,
                background: activeFontPairing.id === fp.id ? 'var(--bg-3)' : 'var(--bg-2)',
                transition: 'all var(--t)',
              }}
            >
              <div style={{ fontFamily: fp.heading, fontSize: 15, fontWeight: 700, color: 'var(--fg)', marginBottom: 2 }}>Aa</div>
              <div style={{ fontFamily: fp.body, fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>{fp.name}</div>
              <div style={{ fontFamily: fp.mono, fontSize: 8, color: 'var(--dim)', letterSpacing: '0.05em' }}>mono</div>
              {activeFontPairing.id === fp.id && (
                <div style={{ fontFamily: 'var(--font-m)', fontSize: 8, color: 'var(--accent)', marginTop: 4 }}>✓ Active</div>
              )}
            </div>
          ))}
        </div>
      </div>

        <div className="page-desc">{allThemes.length} systematic palettes — each designed for a specific content category.</div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Theme</button>
      </div>

      {/* G3: Create custom theme form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: 20, padding: 20 }}>
          <div className="font-mono text-xs" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>New Custom Theme</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label className="form-label">Name</label><input value={newTheme.name} onChange={e => setNewTheme(p => ({...p, name: e.target.value}))} placeholder="My Theme" /></div>
            <div className="form-group"><label className="form-label">Use For</label><input value={newTheme.useFor} onChange={e => setNewTheme(p => ({...p, useFor: e.target.value}))} placeholder="NFTs, Gaming, etc." /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label className="form-label">Accent Color</label><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="color" value={newTheme.accent} onChange={e => setNewTheme(p => ({...p, accent: e.target.value}))} style={{ width: 40, height: 32, border: 'none', padding: 0, cursor: 'pointer' }} /><input value={newTheme.accent} onChange={e => setNewTheme(p => ({...p, accent: e.target.value}))} style={{ flex: 1 }} /></div></div>
            <div className="form-group"><label className="form-label">Base Color</label><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="color" value={newTheme.base} onChange={e => setNewTheme(p => ({...p, base: e.target.value}))} style={{ width: 40, height: 32, border: 'none', padding: 0, cursor: 'pointer' }} /><input value={newTheme.base} onChange={e => setNewTheme(p => ({...p, base: e.target.value}))} style={{ flex: 1 }} /></div></div>
          </div>
          {/* Live preview */}
          <div style={{ padding: 16, background: newTheme.base, borderRadius: 'var(--r)', border: `1px solid ${newTheme.accent}30`, marginTop: 12, marginBottom: 12, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: newTheme.accent }}>WHIZ</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: `${newTheme.accent}80`, marginTop: 4 }}>{newTheme.useFor || 'CUSTOM THEME'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={createTheme}>Create Theme</button>
          </div>
        </div>
      )}

      {/* G5: Side-by-side comparison hint */}
      <div className="themes-grid">
        {allThemes.map(t => (
          <div key={t.id} className={`theme-card ${activeTheme.id === t.id ? 'active-theme' : ''}`}
            onClick={() => { setActiveTheme(t); showToast(`Theme switched to ${t.name}`); }}>
            {/* G4: Better preview with mini-frame elements */}
            <div className="theme-card-preview" style={{ background: t.base, position: 'relative' }}>
              {/* Mini frame preview */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: t.accent }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: t.accent, letterSpacing: '-0.02em' }}>WHIZ</div>
                <div style={{ width: 40, height: 1, background: `linear-gradient(90deg, ${t.accent}60, transparent)` }} />
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: `${t.accent}80`, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {t.useFor?.toUpperCase().slice(0, 28) || 'THEME'}
                </div>
              </div>
              {/* G1, G2: Use SVG checkmark instead of Unicode */}
              {activeTheme.id === t.id && (
                <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${t.accent}60` }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.base} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
            </div>
            <div className="theme-card-body">
              <div className="theme-card-name">{t.name}{t.custom && <span style={{ fontSize: 9, color: 'var(--dim)', marginLeft: 6 }}>CUSTOM</span>}</div>
              <div className="theme-card-desc">{t.useFor}</div>
              <div className="theme-swatches">
                <div className="theme-swatch-block">
                  <div style={{ fontFamily: 'var(--font-m)', fontSize: 8, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Base</div>
                  <div style={{ height: 28, borderRadius: 5, background: t.base, border: '1px solid var(--border)' }} />
                </div>
                <div className="theme-swatch-block">
                  <div style={{ fontFamily: 'var(--font-m)', fontSize: 8, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Accent</div>
                  <div style={{ height: 28, borderRadius: 5, background: t.accent, boxShadow: `0 2px 8px ${t.accent}40` }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className={`btn ${activeTheme.id === t.id ? 'btn-primary' : 'btn-secondary'} btn-sm`} style={{ flex: 1 }}
                  onClick={(e) => { e.stopPropagation(); setActiveTheme(t); showToast(`Theme: ${t.name}`); }}>
                  {activeTheme.id === t.id ? '✓ Active' : 'Apply'}
                </button>
                {t.custom && (
                <button
                  className={`btn btn-sm ${deleteConfirmTheme === t.id ? 'btn-danger' : 'btn-ghost'}`}
                  onClick={e => { e.stopPropagation(); deleteConfirmTheme === t.id ? confirmDeleteTheme() : setDeleteConfirmTheme(t.id); }}
                  title={deleteConfirmTheme === t.id ? 'Click again to confirm delete' : 'Delete theme'}
                >{deleteConfirmTheme === t.id ? 'Confirm?' : '✕'}</button>
              )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
