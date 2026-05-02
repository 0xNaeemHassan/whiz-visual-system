import { useState, useMemo, useRef, useEffect } from 'react';
import { FRAMES, TIER_NAMES } from '../data/frames';
import { useLocalStorage } from '../hooks/useLocalStorage';
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
  const lines = {
    body: <><div className="mini-line h" style={{ background: `${accent}30` }} /><div className="mini-line" /><div className="mini-line s" /><div className="mini-line" /><div className="mini-line" /></>,
    table: <><div className="mini-line h" style={{ background: `${accent}30`, width: '100%' }} />{[1,2,3].map(i => <div key={i} style={{ display: 'flex', gap: 3 }}><div className="mini-line" style={{ flex: 1 }} /><div className="mini-line s" style={{ flex: 1 }} /><div className="mini-line" style={{ flex: 1 }} /></div>)}</>,
    'bull-bear': <><div className="mini-line h" style={{ background: `${accent}30` }} /><div style={{ display: 'flex', gap: 3 }}><div style={{ flex: 1, padding: 3, border: `1px solid ${accent}30`, borderRadius: 2 }}><div className="mini-line s" style={{ background: accent }} /></div><div style={{ flex: 1, padding: 3, border: '1px solid rgba(255,90,90,0.3)', borderRadius: 2 }}><div className="mini-line s" style={{ background: '#FF5A5A' }} /></div></div></>,
    stats: <><div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>{[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 12, background: `${accent}15`, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 8, height: 2, background: accent, borderRadius: 1 }} /></div>)}</div><div className="mini-line h" style={{ background: `${accent}30` }} /><div className="mini-line" /></>,
    heatmap: <><div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>{Array.from({length:28},(_,i)=><div key={i} style={{height:5,background:i%3===0?`${accent}50`:i%2===0?'rgba(255,90,90,0.3)':'var(--bg-3,#1a1d22)',borderRadius:1}}/>)}</div></>,
    compare: <><div style={{display:'flex',gap:2}}><div style={{flex:1,padding:3,border:`1px solid ${accent}30`,borderRadius:2}}><div className="mini-line s" style={{background:accent}}/><div className="mini-line"/><div className="mini-line"/></div><div style={{flex:1,padding:3,border:'1px solid rgba(139,149,163,0.2)',borderRadius:2}}><div className="mini-line s"/><div className="mini-line"/><div className="mini-line"/></div></div></>,
    scorecard: <><div className="mini-line h" style={{background:`${accent}30`}}/>{[1,2,3,4].map(i=><div key={i} style={{display:'flex',gap:2,marginBottom:2,alignItems:'center'}}><div style={{width:6,height:6,fontSize:5,color:accent,fontFamily:'monospace'}}>{i}</div><div className="mini-line" style={{flex:1}}/><div style={{width:8,height:6,background:`${accent}20`,borderRadius:1}}/></div>)}</>,
    quote: <><div style={{width:10,height:10,fontSize:12,color:accent,lineHeight:1,fontFamily:'serif',opacity:0.7}}>"</div><div className="mini-line h" style={{background:`${accent}30`}}/><div className="mini-line"/><div className="mini-line s"/></>,
    grid: <><div className="mini-line h" style={{ background: `${accent}30` }} /><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>{[1,2,3,4].map(i => <div key={i} style={{ height: 10, background: `${accent}08`, border: `1px solid ${accent}15`, borderRadius: 2 }} />)}</div></>,
    timeline: <><div className="mini-line h" style={{ background: `${accent}30` }} />{[1,2,3].map(i => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}><div style={{ width: 4, height: 4, borderRadius: '50%', background: accent, flexShrink: 0 }} /><div className="mini-line" style={{ flex: 1 }} /></div>)}</>,
    network: <><div className="mini-line h" style={{ background: `${accent}30` }} /><div style={{ position: 'relative', height: 20 }}><div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 10, height: 10, borderRadius: '50%', border: `1px solid ${accent}`, background: `${accent}20` }} />{[0,1,2].map(i => <div key={i} style={{ position: 'absolute', left: `${20+i*30}%`, top: `${i%2?20:70}%`, width: 6, height: 6, borderRadius: '50%', background: `${accent}30` }} />)}</div></>,
    editorial: <><div className="mini-line h" style={{ background: `${accent}30` }} /><div className="mini-line" style={{ height: 6 }} /><div style={{ borderLeft: `2px solid ${accent}40`, paddingLeft: 4, marginBottom: 3 }}><div className="mini-line s" /></div><div className="mini-line" /></>,
  
    'tier-list':    <><div style={{flex:1,display:'flex',flexDirection:'column',gap:2}}>{['S','A','B','C'].map((t,i)=><div key={t} style={{display:'flex',gap:2,alignItems:'center'}}><div style={{width:10,height:8,background:i===0?accent:`${accent}30`,borderRadius:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:6,color:i===0?'#090D10':accent,fontWeight:700}}>{t}</div><div className="mini-line" style={{flex:1}}/></div>)}</>,
    'postmortem':   <><div className="mini-line h" style={{background:'rgba(255,90,90,0.4)',marginBottom:3}}/>{[1,2,3].map(i=><div key={i} style={{padding:'2px 3px',background:'rgba(255,90,90,0.06)',borderRadius:1,marginBottom:2}}><div className="mini-line s"/></div>)}</>,
    'trust-stack':  <><div style={{flex:1,display:'flex',flexDirection:'column',gap:2}}>{[100,85,70,55,40].map((w,i)=><div key={i} style={{height:7,width:`${w}%`,alignSelf:'flex-end',background:`${accent}${i===0?'40':'18'}`,borderRadius:2}}/>)}</>,
    'pitch-deck':   <><div style={{textAlign:'center',marginBottom:3}}><div style={{width:10,height:10,borderRadius:'50%',background:`${accent}20`,border:`1px solid ${accent}`,margin:'0 auto 2px'}}/><div className="mini-line h" style={{background:`${accent}60`,width:'60%',margin:'0 auto'}}/></div><div style={{display:'flex',gap:2}}>{[1,2,3,4].map(i=><div key={i} style={{flex:1,height:10,background:`${accent}10`,borderRadius:1}}/>)}</>,
    'mechanism':    <><div style={{flex:1,display:'flex',flexDirection:'column',gap:2}}>{[1,2,3,4].map(i=><div key={i} style={{display:'flex',gap:3,alignItems:'center'}}><div style={{width:8,height:8,borderRadius:'50%',border:`1px solid ${accent}`,background:i===0?accent:'transparent',flexShrink:0}}/><div className="mini-line" style={{flex:1}}/></div>)}</>,
    'thesis':       <><div className="mini-line h" style={{background:`${accent}70`,marginBottom:3}}/><div className="mini-line s" style={{marginBottom:4}}/><div className="mini-line"/><div className="mini-line"/></>,
    'cover-story':  <><div style={{flex:1,background:`${accent}06`,border:`1px solid ${accent}18`,borderRadius:2,display:'flex',flexDirection:'column',justifyContent:'flex-end',padding:3}}><div style={{height:2,width:'40%',background:accent,marginBottom:3}}/><div className="mini-line h" style={{background:accent}}/></>,
    'receipt':      <><div style={{textAlign:'center',marginBottom:2,fontFamily:'monospace',fontSize:7,color:accent}}>***</div>{[1,2,3].map(i=><div key={i} style={{display:'flex',justifyContent:'space-between',marginBottom:2}}><div className="mini-line" style={{flex:1,marginRight:4}}/><div style={{width:10,height:4,background:`${accent}25`,borderRadius:1}}/></div>)}</>,
    'glossary':     <><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:2}}>{[1,2,3,4,5,6].map(i=><div key={i} style={{display:'flex',gap:2}}><div style={{width:8,height:4,background:`${accent}50`,borderRadius:1}}/><div className="mini-line" style={{flex:1}}/></div>)}</>,
    'matrix':       <><div style={{flex:1,position:'relative'}}><div style={{position:'absolute',left:'50%',top:0,bottom:0,width:1,background:'rgba(255,255,255,0.08)'}}/><div style={{position:'absolute',top:'50%',left:0,right:0,height:1,background:'rgba(255,255,255,0.08)'}}/>{[{l:'20%',t:'25%'},{l:'70%',t:'30%'},{l:'30%',t:'65%'},{l:'75%',t:'70%'}].map((p,i)=><div key={i} style={{position:'absolute',left:p.l,top:p.t,width:5,height:5,borderRadius:'50%',background:accent,opacity:0.8}}/>)}</>,
    'threat-model': <><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:2,flex:1}}>{['SC','EC','GO','OP'].map((l,i)=><div key={l} style={{padding:2,background:'rgba(255,90,90,0.06)',borderRadius:1}}><div style={{fontSize:5,color:'rgba(255,90,90,0.6)',fontFamily:'monospace',marginBottom:1}}>{l}</div><div className="mini-line s"/></div>)}</>,
    'failure-tree': <><div style={{textAlign:'center',marginBottom:2}}><div style={{display:'inline-block',padding:'1px 4px',background:'rgba(255,90,90,0.12)',border:'1px solid rgba(255,90,90,0.3)',borderRadius:2,fontSize:6,color:'rgba(255,90,90,0.8)',fontFamily:'monospace'}}>ROOT</div></div><div style={{display:'flex',gap:2}}>{[1,2,3].map(i=><div key={i} style={{flex:1,padding:2,background:`${accent}08`,borderRadius:1}}><div className="mini-line s"/></div>)}</>,
    'founder':      <><div style={{display:'flex',gap:3,marginBottom:3}}><div style={{width:14,height:14,borderRadius:'50%',background:`${accent}20`,border:`1px solid ${accent}50`,flexShrink:0}}/><div><div className="mini-line h" style={{background:`${accent}60`,marginBottom:1}}/><div className="mini-line s"/></div></div><div style={{flex:1,borderLeft:`2px solid ${accent}40`,paddingLeft:3}}><div className="mini-line"/><div className="mini-line s"/></div></>,
    'anatomy':      <><div style={{flex:1,position:'relative'}}><div style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:16,height:16,borderRadius:'50%',border:`1.5px solid ${accent}`}}/>{[{t:'15%',l:'60%'},{t:'45%',l:'65%'},{t:'15%',l:'5%'},{t:'45%',l:'0%'}].map((p,i)=><div key={i} style={{position:'absolute',top:p.t,left:p.l,width:'28%',height:5,background:`${accent}12`,borderRadius:1}}/>)}</>,
    'flow':         <><div style={{flex:1,display:'flex',flexDirection:'column',gap:2}}>{[1,2,3,4].map(i=><div key={i} style={{display:'flex',gap:2,alignItems:'center'}}><div style={{width:10,height:8,background:i===3?accent:`${accent}18`,borderRadius:2}}/><div className="mini-line" style={{flex:1}}/></div>)}</>,
    'bracket':      <><div style={{flex:1,display:'flex',gap:2,alignItems:'center'}}>{[8,4,2,1].map((n,ci)=><div key={ci} style={{flex:1,display:'flex',flexDirection:'column',gap:1,justifyContent:'space-evenly'}}>{Array.from({length:n},(_,i)=><div key={i} style={{height:4,background:ci===3?accent:`${accent}30`,borderRadius:1}}/>)}</div>)}</>,
    'three-layer':  <><div style={{flex:1,display:'flex',flexDirection:'column',gap:3}}>{['rgba(255,255,255,0.15)',accent,'rgba(255,255,255,0.3)'].map((c,i)=><div key={i} style={{flex:1,padding:'2px 4px',background:'rgba(255,255,255,0.03)',border:`1px solid ${c}20`,borderRadius:2}}><div className="mini-line h" style={{background:c,marginBottom:1}}/><div className="mini-line s"/></div>)}</>,
    'long-bet':     <><div style={{flex:1,position:'relative'}}><div style={{position:'absolute',left:8,top:0,bottom:0,width:1,background:`${accent}30`}}/>{[20,40,60,80].map((top,i)=><div key={i} style={{position:'absolute',left:4,top:`${top}%`,display:'flex',gap:4,alignItems:'center'}}><div style={{width:8,height:8,borderRadius:'50%',border:`1px solid ${accent}60`,background:'#0F1318',zIndex:1}}/><div className="mini-line" style={{width:36}}/></div>)}</>,
    'org-chart':    <><div style={{flex:1,display:'flex',gap:3}}>{[1,2,3].map(c=><div key={c} style={{flex:1,display:'flex',flexDirection:'column',gap:2,justifyContent:'space-evenly'}}>{Array.from({length:c===1?1:c===2?2:3},(_,i)=><div key={i} style={{padding:'2px 3px',background:c===1?`${accent}18`:'rgba(255,255,255,0.04)',border:`1px solid ${c===1?accent:'rgba(255,255,255,0.08)'}`,borderRadius:2}}><div className="mini-line s"/></div>)}</div>)}</>,
    'periodic':     <><div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:1}}>{Array.from({length:20},(_,i)=><div key={i} style={{aspectRatio:'1',background:`${accent}0A`,borderTop:`2px solid ${accent}40`,borderRadius:1}}/>)}</>,
    'curve':        <><div style={{flex:1,display:'flex',alignItems:'flex-end',position:'relative'}}><svg width="100%" height="100%" viewBox="0 0 60 40" style={{overflow:'visible'}}><polyline points="0,35 10,28 20,15 30,22 40,10 50,12 60,8" fill="none" stroke={accent} strokeWidth="1.5"/><circle cx="40" cy="10" r="2.5" fill={accent}/></svg></>,
    'field-guide':  <><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:2}}>{[1,2,3,4].map(i=><div key={i} style={{padding:'2px 3px',background:`${accent}08`,border:`1px solid ${accent}15`,borderRadius:2}}><div className="mini-line h" style={{background:`${accent}60`,marginBottom:1}}/><div className="mini-line s"/></div>)}</>,
    'mental-model': <><div className="mini-line h" style={{background:accent,marginBottom:3}}/><div style={{padding:'3px 4px',background:`${accent}08`,borderRadius:2,marginBottom:4}}><div className="mini-line"/></div>{[1,2,3].map(i=><div key={i} style={{display:'flex',gap:2,marginBottom:2}}><div style={{width:6,height:6,borderRadius:'50%',border:`1px solid ${accent}`,background:`${accent}15`}}/><div className="mini-line" style={{flex:1}}/></div>)}</>,
    'subway':       <><div style={{flex:1,display:'flex',flexDirection:'column',gap:3}}>{['#3CE6A6','#7B8EF8','#E5B23A'].map((c,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:2}}><div style={{width:12,height:6,background:`${c}18`,border:`1px solid ${c}30`,borderRadius:1}}/><div style={{flex:1,height:1,background:`${c}40`}}/></div>)}</>,
    'constellation':<><div style={{flex:1,position:'relative'}}>{[{l:'20%',t:'30%'},{l:'65%',t:'22%'},{l:'15%',t:'62%'},{l:'70%',t:'57%'},{l:'45%',t:'42%'}].map((p,i)=><div key={i} style={{position:'absolute',left:p.l,top:p.t,width:10,height:10,borderRadius:'50%',background:`${accent}18`,border:`1px solid ${accent}50`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:5,color:accent}}>{i+1}</div>)}</>,
    'stack':        <><div style={{flex:1,display:'flex',flexDirection:'column',gap:2}}>{['#E5B23A','#7B8EF8',accent,'#3FE2D6','#9DB4D0'].map((c,i)=><div key={i} style={{padding:'2px 5px',background:`${c}06`,borderLeft:`2px solid ${c}`,borderRadius:'0 3px 3px 0'}}><div className="mini-line s" style={{background:`${c}40`}}/></div>)}</>,
    'trade-routes': <><div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'space-evenly'}}>{[1,2,3,4].map(i=><div key={i} style={{display:'flex',alignItems:'center',gap:2}}><div style={{width:14,height:5,background:'rgba(255,255,255,0.05)',borderRadius:1}}/><div style={{flex:1,height:1,background:`${accent}50`}}/><div style={{width:14,height:5,background:'rgba(255,255,255,0.05)',borderRadius:1}}/></div>)}</>,
};
  return (
    <div className={`mini-whiz-frame layout-${layout || 'body'}`}>
      <div className="mini-ticker" />
      <div className="mini-spine" style={{ background: accent }} />
      <div className="mini-body">{lines[layout] || lines.body}</div>
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
                  <span className={`tier-pill tier-${frame.tier}`}>T{frame.tier}</span>
                  <span className="layout-badge">{frame.layout}</span>
                </div>
                <div className="frame-name">{frame.name}</div>
                <div className="frame-desc-text">{frame.desc}</div>
                <div className="frame-actions">
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {frame.tags.slice(0, 2).map(t => (
                      <span key={t} style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--dim)', background: 'var(--bg-3)', padding: '2px 6px', borderRadius: 10, border: '1px solid var(--border)' }}>{t}</span>
                    </LazyCard>))}
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
                  <td><span className={`tier-pill tier-${frame.tier}`}>T{frame.tier}</span></td>
                  <td><strong style={{ fontSize: 13 }}>{frame.name}</strong></td>
                  <td><span className="layout-badge">{frame.layout}</span></td>
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
              <span className={`tier-pill tier-${previewFrame.tier}`}>Tier {previewFrame.tier}</span>
              <span style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--dim)', padding: '3px 8px', background: 'var(--bg-3)', borderRadius: 10 }}>{previewFrame.layout}</span>
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
