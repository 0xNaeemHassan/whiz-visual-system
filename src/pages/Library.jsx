import { useState, useMemo, useRef, useEffect } from 'react';
import { FRAMES, TIER_NAMES } from '../data/frames';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { SemanticChip } from '../components/primitives';
const FRAME_GUIDES = {4: 'Best for weekly yield data. Use TICKER/EVENT/TIME/IMPACT columns.', 8: 'Investment memo format. Set a pull quote and 4 key stats.', 13: "3 bullet points per side. End with a WHIZ'S CALL in the deck.", 21: 'S/A/B/C/D rows. Set col2 to the tier letter for each item.', 25: 'One row: col1=what happened, col2=root cause, col3=recovery, col4=lesson.', 42: 'Long-form. Put 3 paragraphs in body, split by double newline.', 49: "col1=item, col2=method, col3=cost (use + for benefits), col4='benefit'/'risk'", 50: 'Quarterly only. Set volume number and a single powerful headline.'};



// M-05: LazyCard — only render frame card when visible in viewport
function LazyCard({ children, height = 240 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (visible) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);
  return (
    <div ref={ref} style={{ minHeight: visible ? undefined : height }}>
      {visible ? children : null}
    </div>
  );
}

// E1: Unique MiniFrame thumbnails per layout type
function MiniFrame({ accent, layout }) {
  const isTable = ['table', 'scorecard', 'compare', 'tier-list'].includes(layout);
  const isGraph = ['timeline', 'network', 'matrix', 'curve', 'constellation', 'trade-routes'].includes(layout);
  return (
    <div className={`mini-whiz-frame layout-${layout || 'body'}`}>
      <div className="mini-ticker" />
      <div className="mini-spine" style={{ background: accent }} />
      <div className="mini-body">
        <div className="mini-line h" style={{ background: `${accent}35` }} />
        {isTable && [1,2,3,4].map(i => (
          <div key={i} style={{ display: 'flex', gap: 3, marginBottom: 2 }}>
            <div className="mini-line" style={{ flex: 1 }} />
            <div className="mini-line s" style={{ width: '30%' }} />
          </div>
        ))}
        {isGraph && (
          <div style={{ height: 28, border: `1px solid ${accent}25`, borderRadius: 3, background: `${accent}08` }} />
        )}
        {!isTable && !isGraph && (
          <>
            <div className="mini-line" />
            <div className="mini-line s" />
            <div className="mini-line" />
          </>
        )}
      </div>
      <div className="mini-footer" />
      <div className="mini-c tl" /><div className="mini-c tr" /><div className="mini-c bl" /><div className="mini-c br" />
    </div>
  );
}

export default function Library({ navigateTo, showToast, activeTheme }) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [tagFilter, setTagFilter] = useState('');
  const [layoutFilter, setLayoutFilter] = useState('');
  const [view, setView] = useState('grid');
  const [previewFrame, setPreviewFrame] = useState(null); // Fix #61: preview modal
  const [sortBy, setSortBy] = useLocalStorage('whiz-library-sort', 'id'); // Fix #36: persisted
  const [favorites, setFavorites] = useLocalStorage('whiz-favorites', []); // E7
  const [showFavOnly, setShowFavOnly] = useLocalStorage('whiz-lib-favonly', false); // Fix #59
  const [recentlyUsed, setRecentlyUsed] = useLocalStorage('whiz-recent-frames', []); // E7 — Fixed

  const tiers = ['ALL', ...Object.keys(TIER_NAMES)];
  const layouts = useMemo(() => [...new Set(FRAMES.map(f => f.layout))].sort(), []);

  const filtered = useMemo(() => {
    let f = FRAMES;
    if (tierFilter !== 'ALL') f = f.filter(fr => fr.tier === tierFilter);
    if (layoutFilter) f = f.filter(fr => fr.layout === layoutFilter);
    if (search) { const q = search.toLowerCase(); f = f.filter(fr => fr.name.toLowerCase().includes(q) || fr.desc.toLowerCase().includes(q) || fr.tags.some(t => t.includes(q)) || fr.layout.includes(q)); }
    if (tagFilter) f = f.filter(fr => fr.tags.includes(tagFilter));
    if (showFavOnly) f = f.filter(fr => favorites.includes(fr.id)); // Fix #59
    // E2: Sort
    if (sortBy === 'name') f = [...f].sort((a,b) => a.name.localeCompare(b.name));
    else if (sortBy === 'layout') f = [...f].sort((a,b) => a.layout.localeCompare(b.layout));
    else if (sortBy === 'tier') f = [...f].sort((a,b) => a.tier.localeCompare(b.tier));
    return f;
  }, [search, tierFilter, tagFilter, layoutFilter, sortBy]);

  const allTags = useMemo(() => {
    const s = new Set(); FRAMES.forEach(f => f.tags.forEach(t => s.add(t))); return Array.from(s).sort();
  }, []);

  const toggleFav = (id) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  return (
    <>
      <div className="page-header">
        <div className="page-title">Frame Library</div>
        <div className="page-desc">50 templates across 8 tiers — your complete DeFi infographic system.</div>
      </div>

      <div className="lib-toolbar">
        <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="9" r="5"/><path d="m15 15-3-3"/></svg>
          <input placeholder="Search frames by name, tag, or layout..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
        </div>
        {/* E2: Sort */}
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} aria-label="Sort by" style={{ width: 'auto', minWidth: 100 }}>
          <option value="id">Sort: #</option>
          <option value="name">Sort: Name</option>
          <option value="layout">Sort: Layout</option>
          <option value="tier">Sort: Tier</option>
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={`view-btn ${view==='grid'?'active':''}`} onClick={() => setView('grid')} aria-label="Grid view">Grid</button>
          <button className={`view-btn ${view==='list'?'active':''}`} onClick={() => setView('list')} aria-label="List view">List</button>
        </div>
      </div>

      {/* M-06: Recently Used section */}
      {recentlyUsed.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Recently Used</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {recentlyUsed.slice(0, 8).map(id => {
              const fr = FRAMES.find(f => f.id === id);
              if (!fr) return null;
              return (
                <div key={id}
                  style={{ flexShrink: 0, width: 80, cursor: 'pointer', padding: 6, borderRadius: 'var(--r)', background: 'var(--bg-2)', border: '1px solid var(--border)', transition: 'border-color var(--t)' }}
                  onClick={() => { setRecentlyUsed(prev => [id, ...prev.filter(i => i !== id)].slice(0, 20)); navigateTo('editor', id); }}
                  title={fr.name}
                >
                  <MiniFrame accent={activeTheme.accent} layout={fr.layout} />
                  <div style={{ fontFamily: 'var(--font-m)', fontSize: 8, color: 'var(--muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>#{fr.id} {fr.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tier filters */}
      <div className="filter-group" style={{ marginBottom: 12 }}>
        {tiers.map(t => (
          <button key={t} className={`filter-btn ${tierFilter===t?'active':''}`} onClick={() => setTierFilter(t)}>
            {t === 'ALL' ? 'All Tiers' : `Tier ${t}`}
          </button>
        ))}
      </div>

      {/* Layout filter */}
      <div className="filter-group" style={{ marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'center' }}>LAYOUT:</span>
        <button className={`filter-btn ${!layoutFilter?'active':''}`} onClick={() => setLayoutFilter('')}>All</button>
        {layouts.map(l => (
          <button key={l} className={`filter-btn ${layoutFilter===l?'active':''}`} onClick={() => setLayoutFilter(layoutFilter===l?'':l)} style={{ fontSize: 9 }}>{l}</button>
        ))}
      </div>

      {/* E6: Tag filters with active count */}
      <div className="filter-group" style={{ marginBottom: 16 }}>
        <span style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'center' }}>TAGS:</span>
        {allTags.map(t => {
          // Fix #42: count against current tier+layout subset, not all frames
          const baseFiltered = FRAMES
            .filter(fr => tierFilter === 'ALL' || fr.tier === tierFilter)
            .filter(fr => !layoutFilter || fr.layout === layoutFilter);
          const count = baseFiltered.filter(fr => fr.tags.includes(t)).length;
          return (
            <button key={t} className={`filter-btn ${tagFilter===t?'active':''}`} onClick={() => setTagFilter(tagFilter===t?'':t)} style={{ fontSize: 9 }}>
              {t} <span style={{ opacity: 0.5 }}>({count})</span>
            </button>
          );
        })}
      </div>

      <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--dim)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span>{filtered.length} of {FRAMES.length} frames</span>
        {favorites.length > 0 && (
            <button
              className={`filter-btn btn-sm ${showFavOnly ? 'active' : ''}`}
              style={{ fontSize: 10 }}
              onClick={() => setShowFavOnly(v => !v)}
            >
              {showFavOnly ? '★ Favorites Only' : `☆ ${favorites.length} Favorited`}
            </button>
          )}
      </div>

      {view === 'grid' ? (
        <div className="frames-grid">
          {filtered.map(frame => (
            <LazyCard key={frame.id}>
            <div className="frame-card" title={FRAME_GUIDES[frame.id] || frame.desc} onClick={() => {
                setRecentlyUsed(prev => {
                  const next = [frame.id, ...prev.filter(id => id !== frame.id)].slice(0, 20);
                  return next;
                });
                navigateTo('editor', frame.id);
              }}>
              <div className="frame-thumb">
                <MiniFrame accent={activeTheme.accent} layout={frame.layout} />
                <span className="frame-num">{String(frame.id).padStart(2, '0')}</span>
                <span style={{
                  position: 'absolute', bottom: 6, left: 6,
                  fontFamily: 'var(--font-m)', fontSize: 7, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--dim)',
                  background: 'rgba(0,0,0,0.6)', padding: '2px 5px', borderRadius: 3,
                }}>{frame.layout}</span>
                {/* E7: Favorite star */}
                <button className="fav-btn" onClick={e => { e.stopPropagation(); toggleFav(frame.id); }}
                  style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: favorites.includes(frame.id) ? '#E5B23A' : 'var(--dim)', zIndex: 2, padding: 2 }}
                  aria-label={favorites.includes(frame.id) ? 'Remove from favorites' : 'Add to favorites'}>
                  {favorites.includes(frame.id) ? '★' : '☆'}
                </button>
              </div>
              <div className="frame-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <SemanticChip kind="category" value={`tier-${frame.tier}`}>T{frame.tier}</SemanticChip>
                  <SemanticChip kind="category" value={frame.layout}>{frame.layout}</SemanticChip>
                </div>
                <div className="frame-name">{frame.name}</div>
                <div className="frame-desc-text">{frame.desc}</div>
                <div className="frame-actions">
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {frame.tags.slice(0, 2).map(t => (
                      <span key={t} style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--dim)', background: 'var(--bg-3)', padding: '2px 6px', borderRadius: 10, border: '1px solid var(--border)' }}>{t}</span>
                    ))}
                  </div>
                  {/* E4: Always visible button, not hover-only */}
                  <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setPreviewFrame(frame); }} title="Quick preview">Preview</button>
                  <button className="btn btn-primary btn-sm" onClick={e => {
                    e.stopPropagation();
                    setRecentlyUsed(prev => [frame.id, ...prev.filter(id => id !== frame.id)].slice(0, 20));
                    navigateTo('editor', frame.id);
                    showToast(`Opened Frame ${frame.id}`);
                  }}>
                    Use →
                  </button>
                </div>
              </div>
            </div>
            </LazyCard>
          ))}
        </div>
      ) : (
        /* E5: Paginated list */
        <div className="card" style={{ padding: 0 }}>
          <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>#</th><th>Tier</th><th>Name</th><th>Layout</th><th>Tags</th><th></th></tr></thead>
            <tbody>
              {filtered.map(frame => (
                <tr key={frame.id}>
                  <td><span style={{ fontFamily: 'var(--font-m)', color: 'var(--dim)' }}>{String(frame.id).padStart(2,'0')}</span></td>
                  <td><SemanticChip kind="category" value={`tier-${frame.tier}`}>T{frame.tier}</SemanticChip></td>
                  <td><strong style={{ fontSize: 13 }}>{frame.name}</strong></td>
                  <td><SemanticChip kind="category" value={frame.layout}>{frame.layout}</SemanticChip></td>
                  <td><div style={{ display: 'flex', gap: 4 }}>{frame.tags.slice(0,2).map(t => (<span key={t} style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--dim)', background: 'var(--bg-3)', padding: '1px 5px', borderRadius: 8, border: '1px solid var(--border)' }}>{t}</span>))}</div></td>
                  <td><button className="btn btn-secondary btn-sm" onClick={() => {
                    setRecentlyUsed(prev => [frame.id, ...prev.filter(id => id !== frame.id)].slice(0, 20));
                    navigateTo('editor', frame.id);
                    showToast(`Editing: ${frame.name}`);
                  }}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    {/* Fix #61: Frame preview modal */}
      {previewFrame && (
        <div className="modal-overlay open" onClick={() => setPreviewFrame(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{previewFrame.name}</span>
              <button className="modal-close" onClick={() => setPreviewFrame(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{previewFrame.desc}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <SemanticChip kind="category" value={`tier-${previewFrame.tier}`}>Tier {previewFrame.tier}</SemanticChip>
              <SemanticChip kind="category" value={previewFrame.layout}>{previewFrame.layout}</SemanticChip>
              {previewFrame.tags.map(t => <span key={t} style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--dim)', padding: '2px 6px', background: 'var(--bg-3)', borderRadius: 8 }}>{t}</span>)}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPreviewFrame(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => {
                setRecentlyUsed(prev => [previewFrame.id, ...prev.filter(id => id !== previewFrame.id)].slice(0, 20));
                navigateTo('editor', previewFrame.id);
                setPreviewFrame(null);
              }}>Use This Frame →</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}