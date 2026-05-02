import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { FRAMES } from '../data/frames';
import { THEMES } from '../data/themes';
import { useLocalStorage } from '../hooks/useLocalStorage';

const STATUSES = ['draft', 'planned', 'wip', 'done', 'published'];
const CONFIDENCE = ['low', 'medium', 'high'];
const KANBAN_COLS = [
  { id: 'draft', label: 'DRAFT', color: '#8B95A3' },
  { id: 'planned', label: 'PLANNED', color: '#6FA8FF' },
  { id: 'wip', label: 'IN PROGRESS', color: '#E5B23A' },
  { id: 'done', label: 'DONE', color: '#3CE6A6' },
  { id: 'published', label: 'PUBLISHED', color: '#B97AFF' },
];

// F1: Kanban drag-and-drop helpers
function useDragDrop(onDrop) {
  const dragItem = useRef(null);
  const startDrag = (id) => { dragItem.current = id; };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (targetStatus) => {
    if (dragItem.current != null) { onDrop(dragItem.current, targetStatus); dragItem.current = null; }
  };
  // Touch support
  const touchStart = useRef({ id: null, x: 0, y: 0 });
  const handleTouchStart = (id, e) => { touchStart.current = { id, x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const col = el?.closest('[data-kanban-col]');
    if (col && touchStart.current.id != null) {
      onDrop(touchStart.current.id, col.dataset.kanbanCol);
    }
    touchStart.current = { id: null, x: 0, y: 0 };
  };
  return { startDrag, handleDragOver, handleDrop, handleTouchStart, handleTouchEnd };
}

export default function Planner({ showToast, activeTheme, navigateTo, isActive }) {
  const [issues, setIssues] = useLocalStorage('whiz-issues', []);
  const [view, setView] = useState('table');
  // Fix #20: reset deleteConfirmId on view change
  const setViewSafe = (v) => { setView(v); setDeleteConfirmId(null); };

  // M-08: Calendar helpers
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const issuesByDate = issues.reduce((acc, iss) => {
    if (iss.publishDate) {
      acc[iss.publishDate] = acc[iss.publishDate] || [];
      acc[iss.publishDate].push(iss);
    }
    return acc;
  }, {});
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // M-09: Analytics computed values
  const statusCounts = ['draft','scheduled','published','archived'].map(s => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    count: issues.filter(i => i.status === s).length,
    color: s === 'published' ? '#3CE6A6' : s === 'scheduled' ? '#7B8EF8' : s === 'archived' ? '#555' : '#8B95A3',
  }));
  const frameUsage = Object.entries(
    issues.filter(i => i.frameId).reduce((a, i) => { a[i.frameId] = (a[i.frameId] || 0) + 1; return a; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const monthlyActivity = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    return {
      label: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
      count: issues.filter(iss => iss.publishDate && iss.publishDate.slice(5, 7) === m).length,
    };
  });
  const maxMonthly = Math.max(1, ...monthlyActivity.map(m => m.count));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [seriesFocusFilter, setSeriesFocusFilter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingIssue, setEditingIssue] = useState(null);
  const [form, setForm] = useState({
    issueNum: '', topic: '', frameId: '', themeId: '', status: 'draft', priority: 'medium',
    publishDate: '', notes: '', caption: '', sourceLinks: '', confidence: 'medium', series: '',
  });
  const normalizeIssueNum = (v) => String(v || '').replace(/\D/g, '').slice(-3).padStart(3, '0');
  const existingIssueNums = new Set(issues.map(i => String(i.issueNum || '').padStart(3, '0')));

  // Escape handler
  useEffect(() => {
    const handler = () => { setShowModal(false); setDeleteConfirmId(null); };
    if (!isActive) return;
    window.addEventListener('whiz-escape', handler);
    return () => window.removeEventListener('whiz-escape', handler);
  }, []);

  const openNewIssue = (presetStatus) => {
    const nextN = issues.length > 0 ? Math.max(...issues.map(i => Number(i.issueNum) || 0)) + 1 : 1;
    setEditingIssue(null);
    setForm({
      issueNum: String(nextN).padStart(3,'0'),
      topic: '', frameId: '', themeId: '',
      status: presetStatus || 'draft',
      publishDate: '', notes: '', caption: '', sourceLinks: '',
      priority: 'medium', confidence: 'medium', series: '',
    });
    setShowModal(true);
  };

  const nextNum = issues.length > 0 ? Math.max(...issues.map(i => Number(i.issueNum) || 0)) + 1 : 1;

  const openAdd = (presetStatus) => {
    setEditingIssue(null);
    setForm({ issueNum: String(nextNum).padStart(3,'0'), topic: '', frameId: '', themeId: '', status: presetStatus || 'draft', publishDate: '', notes: '', caption: '', sourceLinks: '', confidence: 'medium', series: '' });
    setShowModal(true);
  };

  const openEdit = (issue) => { setEditingIssue(issue.id); setForm({ confidence: 'medium', series: '', ...issue }); setShowModal(true); };

  // F5: Duplicate issue
  const duplicateIssue = (issue) => {
    const dn = String(nextNum).padStart(3,'0');
    setIssues(prev => [...prev, { ...issue, id: `i_${Date.now()}`, issueNum: dn, status: 'draft', createdAt: Date.now(), topic: `${issue.topic} (copy)` }]);
    showToast('Issue duplicated');
  };

  const saveIssue = () => {
    if (!form.topic.trim()) { showToast('Topic is required', 'error'); return; }
    const normalizedIssueNum = normalizeIssueNum(form.issueNum);
    if (!editingIssue && existingIssueNums.has(normalizedIssueNum)) { showToast(`Issue #${normalizedIssueNum} already exists`, 'error'); return; }
    if (form.status === 'published' && !(form.sourceLinks || '').trim()) { showToast('Source links are required for published issues', 'error'); return; }
    const duplicateTopic = issues.find(i => i.id !== editingIssue && i.topic?.trim().toLowerCase() === form.topic.trim().toLowerCase());
    if (duplicateTopic) showToast(`Duplicate topic detected: #${duplicateTopic.issueNum}`, 'warning');
    // F4: Validate publish date isn't in the past
    if (form.publishDate) {
      const d = new Date(form.publishDate);
      const today = new Date(); today.setHours(0,0,0,0);
      if (d < today) showToast('Publish date is in the past', 'warning');
    }
    if (editingIssue) {
      setIssues(prev => prev.map(i => i.id === editingIssue ? { ...i, ...form, issueNum: normalizedIssueNum } : i));
      showToast('Issue updated');
    } else {
      setIssues(prev => [...prev, { ...form, issueNum: normalizedIssueNum, id: `i_${Date.now()}`, createdAt: Date.now() }]);
      showToast(`Issue #${normalizedIssueNum} created`);
    }
    setShowModal(false);
  };

  // F3: Fixed delete — no auto-reset timer, explicit cancel
  const deleteIssue = (id) => {
    if (deleteConfirmId === id) {
      setIssues(prev => prev.filter(i => i.id !== id));
      showToast('Issue deleted', 'info');
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
    }
  };

  const updateStatus = (id, status) => setIssues(prev => prev.map(i => i.id === id ? { ...i, status } : i));

  // F1: Drop handler for kanban
  const handleKanbanDrop = useCallback((issueId, targetStatus) => {
    setIssues(prev => prev.map(i => (i.id === issueId || String(i.id) === String(issueId)) ? { ...i, status: targetStatus } : i));
    showToast(`Moved to ${targetStatus}`);
  }, [setIssues, showToast]);

  const dnd = useDragDrop(handleKanbanDrop);

  // F8: CSV export with sourceLinks
  const exportCSV = () => {
    const headers = ['Issue #', 'Topic', 'Frame #', 'Theme', 'Status', 'Publish Date', 'Notes', 'Caption', 'Source Links', 'Priority', 'Confidence', 'Series'];
    const rows = issues.map(i => [i.issueNum, i.topic, i.frameId, i.themeId, i.status, i.publishDate, i.notes, i.caption, i.sourceLinks, i.priority || 'medium', i.confidence || 'medium', i.series || ''].map(v => `"${(v||'').replace(/"/g,'""')}"`));
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'whiz_content_planner.csv'; a.click(); URL.revokeObjectURL(url);
    showToast('CSV exported');
  };

  // F9: Import CSV
  const importCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        // Fix #19: proper RFC-4180 CSV parser — handles quoted multiline fields
        const parseCSV = (str) => {
          const rows = []; let cur = [], field = '', inQ = false;
          for (let i = 0; i < str.length; i++) {
            const ch = str[i], nx = str[i+1];
            if (inQ) {
              if (ch === '"' && nx === '"') { field += '"'; i++; }
              else if (ch === '"') inQ = false;
              else field += ch;
            } else {
              if (ch === '"') inQ = true;
              else if (ch === ',') { cur.push(field); field = ''; }
              else if (ch === '\n' || (ch === '\r' && nx === '\n')) {
                cur.push(field); field = '';
                if (cur.some(c => c.trim())) rows.push(cur);
                cur = []; if (ch === '\r') i++;
              } else field += ch;
            }
          }
          if (field || cur.length) { cur.push(field); if (cur.some(c => c.trim())) rows.push(cur); }
          return rows;
        };
        const allRows = parseCSV(text);
        const hasHeader = (allRows[0]?.[0] || '').toLowerCase().includes('issue');
        const lines = hasHeader ? allRows.slice(1) : allRows;
        if (lines.length < 1) { showToast('CSV has no data rows', 'error'); return; }
        const imported = lines.map((cols, idx) => ({
          id: `i_${Date.now()}_${idx}`,
          issueNum: cols[0]?.trim() || '',
          topic: cols[1]?.trim() || '',
          frameId: cols[2]?.trim() || '',
          themeId: cols[3]?.trim() || '',
          status: STATUSES.includes(cols[4]?.trim()) ? cols[4].trim() : 'draft',
          publishDate: cols[5]?.trim() || '',
          notes: cols[6]?.trim() || '',
          caption: cols[7]?.trim() || '',
          sourceLinks: cols[8]?.trim() || '',
          priority: cols[9]?.trim() || 'medium',
          confidence: CONFIDENCE.includes(cols[10]?.trim()) ? cols[10].trim() : 'medium',
          series: cols[11]?.trim() || '',
          createdAt: Date.now(),
        })).filter(i => i.issueNum || i.topic);
        setIssues(prev => [...prev, ...imported]);
        showToast(`Imported ${imported.length} issues`);
      } catch (err) { showToast('Failed to parse CSV', 'error'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };


  const toDateOnly = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const cadenceAlerts = useMemo(() => {
    const now = new Date();
    const dayMs = 1000 * 60 * 60 * 24;
    const grouped = issues.reduce((acc, issue) => {
      const series = (issue.series || '').trim();
      const d = toDateOnly(issue.publishDate);
      if (!series || !d) return acc;
      acc[series] = acc[series] || [];
      acc[series].push({ ...issue, publishDateObj: d });
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([series, seriesIssues]) => {
        const sorted = [...seriesIssues].sort((a, b) => a.publishDateObj - b.publishDateObj);
        const gaps = [];
        for (let i = 1; i < sorted.length; i += 1) {
          gaps.push((sorted[i].publishDateObj - sorted[i - 1].publishDateObj) / dayMs);
        }
        const avgGap = gaps.length ? gaps.reduce((sum, g) => sum + g, 0) / gaps.length : 0;
        const lastPost = sorted[sorted.length - 1].publishDateObj;
        const daysSinceLastPost = Math.max(0, Math.floor((now - lastPost) / dayMs));
        const drift = avgGap > 0 ? daysSinceLastPost - avgGap : daysSinceLastPost;
        const severity = drift >= 14 ? 'critical' : drift >= 7 ? 'warn' : 'info';
        return {
          series,
          avgGapDays: avgGap,
          daysSinceLastPost,
          drift,
          severity,
          issueCount: sorted.length,
          lowConfidenceCount: seriesIssues.filter(i => (i.confidence || 'medium') === 'low').length,
        };
      })
      .filter((a) => a.issueCount >= 2)
      .sort((a, b) => b.drift - a.drift)
      .slice(0, 5);
  }, [issues]);

  const openNewIssueForSeries = (seriesName) => {
    openAdd('planned');
    setForm((prev) => ({ ...prev, series: seriesName, status: 'planned' }));
  };

  const focusLowConfidenceSeries = (seriesName) => {
    setViewSafe('table');
    setStatusFilter('ALL');
    setSeriesFocusFilter(seriesName);
  };

  const filtered = useMemo(() => {
    let f = issues;
    if (statusFilter !== 'ALL') f = f.filter(i => i.status === statusFilter);
    if (search) { const q = search.toLowerCase(); f = f.filter(i => i.topic?.toLowerCase().includes(q) || i.issueNum?.includes(q) || i.notes?.toLowerCase().includes(q) || i.caption?.toLowerCase().includes(q) || i.sourceLinks?.toLowerCase().includes(q)); }
    if (seriesFocusFilter) f = f.filter(i => (i.series || '').trim() === seriesFocusFilter && (i.confidence || 'medium') === 'low');
    return f.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [issues, statusFilter, search, seriesFocusFilter]);

  const stats = STATUSES.reduce((acc, s) => { acc[s] = issues.filter(i => i.status === s).length; return acc; }, {});

  // F10: Open in Editor with frame/theme pre-loaded
  const openInEditor = (issue) => {
    // Fix #21: pass full issue context so Editor can pre-fill content
    const frameId = issue.frameId ? Number(issue.frameId) : undefined;
    navigateTo('editor', frameId, { issue });
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">Content Planner</div>
        <div className="page-desc">Track every issue from idea to published — your content OS.</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {KANBAN_COLS.map(col => (
          <div key={col.id} style={{ padding: '10px 16px', background: 'var(--bg-2)', border: `1px solid var(--border)`, borderRadius: 'var(--r)', borderLeft: `3px solid ${col.color}`, cursor: 'pointer', transition: 'border-color 0.15s' }}
            onClick={() => setStatusFilter(statusFilter === col.id ? 'ALL' : col.id)}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{col.label}</div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 24, fontWeight: 700, color: col.color, lineHeight: 1 }}>{stats[col.id] || 0}</div>
          </div>
        ))}
        <div style={{ padding: '10px 16px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: 24, fontWeight: 700, color: activeTheme.accent, lineHeight: 1 }}>{issues.length}</div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>TOTAL<br/>ISSUES</div>
        </div>
      </div>



      {/* Intelligence Panel */}
      <div className="card" style={{ marginBottom: 16 }} aria-label="Cadence intelligence panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Intelligence</div>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>Top cadence alerts by posting drift.</div>
          </div>
          {seriesFocusFilter && (
            <button className="btn btn-ghost btn-sm" onClick={() => setSeriesFocusFilter(null)}>
              Clear low-confidence filter ({seriesFocusFilter})
            </button>
          )}
        </div>
        {cadenceAlerts.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>No cadence alerts yet. Add at least two dated posts in a series.</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {cadenceAlerts.map((alert) => {
              const severityMeta = {
                info: { label: 'Info', color: '#6FA8FF' },
                warn: { label: 'Warn', color: '#E5B23A' },
                critical: { label: 'Critical', color: '#FF5A5A' },
              }[alert.severity];
              return (
                <div key={alert.series} style={{ border: '1px solid var(--border)', borderLeft: `4px solid ${severityMeta.color}`, borderRadius: 'var(--r)', padding: 10, display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 12 }}>{alert.series}</strong>
                    <span aria-label={`Severity ${severityMeta.label}`} style={{ fontSize: 10, fontFamily: 'var(--font-m)', color: severityMeta.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{severityMeta.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--muted)' }}>
                    <span>Avg gap: {Math.round(alert.avgGapDays)}d</span>
                    <span>Days since last post: {alert.daysSinceLastPost}d</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openNewIssueForSeries(alert.series)}>
                      Create next issue in series
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => focusLowConfidenceSeries(alert.series)}>
                      Boost confidence
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="planner-toolbar">
        <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="9" r="5"/><path d="m15 15-3-3"/></svg>
          <input placeholder="Search topics or issue numbers..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status" style={{ width: 'auto', minWidth: 130 }}>
          <option value="ALL">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
        <div className="planner-views">
          <button className={`view-btn ${view==='table'?'active':''}`} onClick={() => setViewSafe('table')}>Table</button>
          <button className={`view-btn ${view==='kanban'?'active':''}`} onClick={() => setViewSafe('kanban')}>Kanban</button>
          <button className={`view-btn ${view==='calendar'?'active':''}`} onClick={() => setViewSafe('calendar')}>Calendar</button>
          <button className={`view-btn ${view==='analytics'?'active':''}`} onClick={() => setViewSafe('analytics')}>Analytics</button>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={exportCSV}>↓ CSV</button>
        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>↑ CSV<input type="file" accept=".csv" onChange={importCSV} style={{ display: 'none' }} /></label>
        <button className="btn btn-primary" onClick={() => openAdd()}>+ New Issue</button>
      </div>

      {/* Table View */}
      {view === 'table' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="data-table-wrap">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 32, marginBottom: 12 }}>▦</div>
              <div>No issues yet. Click "New Issue" to start your content plan.</div>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>#</th><th>Topic</th><th>Frame</th><th>Theme</th><th>Status</th><th>Date</th><th>Notes</th><th></th></tr></thead>
              <tbody>
                {filtered.map(issue => {
                  const frame = FRAMES.find(f => String(f.id) === String(issue.frameId));
                  const theme = THEMES.find(t => t.id === issue.themeId);
                  const statusCol = KANBAN_COLS.find(c => c.id === issue.status);
                  return (
                    <tr key={issue.id}>
                      <td><span style={{ fontFamily: 'var(--font-m)', color: 'var(--dim)' }}>#{issue.issueNum}</span></td>
                      <td><strong style={{ fontSize: 13 }}>{issue.topic || '—'}</strong></td>
                      <td><span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--muted)' }}>{frame ? `${frame.id}. ${frame.name}` : issue.frameId || '—'}</span></td>
                      <td>{theme ? (<div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.accent, display: 'inline-block' }} /><span style={{ fontSize: 11 }}>{theme.name}</span></div>) : <span style={{ color: 'var(--dim)' }}>—</span>}</td>
                      {/* L6: Color + icon for status, not color-only */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusCol?.color || 'var(--dim)', flexShrink: 0 }} />
                          <select value={issue.status} onChange={e => updateStatus(issue.id, e.target.value)} aria-label={`Status for ${issue.topic}`} style={{ width: 'auto', padding: '3px 6px', fontSize: 11 }}>
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </td>
                      <td><span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--muted)' }}>{issue.publishDate || '—'}</span></td>
                      <td><span style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.notes || '—'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(issue)} aria-label={`Edit ${issue.topic}`}>Edit</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => openInEditor(issue)} title="Open in Frame Editor">→</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => duplicateIssue(issue)} title="Duplicate">⊕</button>
                          <button className={`btn btn-sm ${deleteConfirmId === issue.id ? 'btn-danger' : 'btn-ghost'}`}
                            onClick={() => deleteIssue(issue.id)}>{deleteConfirmId === issue.id ? 'Confirm?' : '✕'}</button>
                          {deleteConfirmId === issue.id && <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirmId(null)} style={{ fontSize: 9 }}>Cancel</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          </div>
        </div>
      )}

      {/* F1: Kanban View with full drag-and-drop */}
      {view === 'kanban' && (
        <div className="kanban-board" style={{ scrollSnapType: 'x mandatory' }}>
          {KANBAN_COLS.map(col => {
            const colIssues = issues.filter(i => i.status === col.id);
            return (
              <div key={col.id} className="kanban-col" data-kanban-col={col.id}
                onDragOver={dnd.handleDragOver} onDrop={() => dnd.handleDrop(col.id)}>
                <div className="kanban-col-header">
                  <span className="kanban-col-title" style={{ color: col.color }}>{col.label}</span>
                  <span className="kanban-col-count">{colIssues.length}</span>
                </div>
                <div className="kanban-cards" style={{ minHeight: 80 }}>
                  {colIssues.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px 8px', fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--dim)', border: '1px dashed var(--border)', borderRadius: 'var(--r)' }}>Drop here</div>
                  ) : colIssues.map(issue => {
                    const frame = FRAMES.find(f => String(f.id) === String(issue.frameId));
                    const theme = THEMES.find(t => t.id === issue.themeId);
                    return (
                      <div key={issue.id} className="kanban-card" data-status={issue.status}
                        draggable onDragStart={() => dnd.startDrag(issue.id)}
                        onTouchStart={(e) => dnd.handleTouchStart(issue.id, e)} onTouchEnd={dnd.handleTouchEnd}
                        style={{ cursor: 'grab', touchAction: 'none' }}
                        onClick={() => openEdit(issue)}>
                        <div className="kanban-card-title">{issue.topic || 'Untitled'}</div>
                        <div className="kanban-card-meta">
                          <span style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--dim)', background: 'var(--bg-2)', padding: '1px 6px', borderRadius: 8 }}>#{issue.issueNum}</span>
                          {frame && <span style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--dim)' }}>F{frame.id}</span>}
                          {theme && <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.accent, flexShrink: 0, display: 'inline-block' }} />}
                          {issue.publishDate && <span style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--dim)' }}>{issue.publishDate}</span>}
                        </div>
                      </div>
                    );
                  })}
                  <button className="btn btn-ghost btn-sm w-full" style={{ marginTop: 4, borderStyle: 'dashed', borderColor: 'var(--border-2)' }}
                    onClick={() => openAdd(col.id)}>+ Add</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Issue Modal */}
      <div className={`modal-overlay ${showModal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setShowModal(false)} role="dialog" aria-modal="true" aria-label={editingIssue ? 'Edit Issue' : 'New Issue'}>
        <div className="modal" style={{ maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
          <div className="modal-header">
            <span className="modal-title">{editingIssue ? `Edit Issue #${form.issueNum}` : 'New Issue'}</span>
            <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label className="form-label">Issue #</label><input value={form.issueNum} onChange={e => setForm(f => ({...f, issueNum: normalizeIssueNum(e.target.value)}))} placeholder="001" /></div>
            <div className="form-group"><label className="form-label">Status</label><select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>{STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}</select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label className="form-label">Confidence</label><select value={form.confidence || 'medium'} onChange={e => setForm(f => ({...f, confidence: e.target.value}))}>{CONFIDENCE.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Series</label><input value={form.series || ''} onChange={e => setForm(f => ({...f, series: e.target.value}))} placeholder="Stablecoin Risk Pt. 1" /></div>
          </div>
          <div className="form-group"><label className="form-label">Topic / Headline *</label><input value={form.topic} onChange={e => setForm(f => ({...f, topic: e.target.value}))} placeholder="The End of Mercenary Yield" autoFocus /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label className="form-label">Frame Template</label><select value={form.frameId} onChange={e => setForm(f => ({...f, frameId: e.target.value}))}><option value="">— Select —</option>{FRAMES.map(fr => <option key={fr.id} value={fr.id}>{fr.id}. {fr.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Color Theme</label><select value={form.themeId} onChange={e => setForm(f => ({...f, themeId: e.target.value}))}><option value="">— Select —</option>{THEMES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          </div>
          <div className="form-group">
            <label className="form-label">
              Publish Date
              {form.publishDate && new Date(form.publishDate) < new Date() && (
                <span style={{ color: '#FF5A5A', fontSize: 9, marginLeft: 6, fontFamily: 'var(--font-m)' }}>⚠ Past date</span>
              )}
            </label>
            <input
              type="date"
              value={form.publishDate}
              style={form.publishDate && new Date(form.publishDate) < new Date() ? { borderColor: '#FF5A5A' } : {}}
              onChange={e => setForm(f => ({...f, publishDate: e.target.value}))}
            />
          </div>
          {/* F6: Caption with character count */}
          <div className="form-group"><label className="form-label">Caption Draft (for X/Twitter)</label><textarea value={form.caption} onChange={e => setForm(f => ({...f, caption: e.target.value}))} rows={2} placeholder="Opening line that hooks readers..." /><div className={`char-count ${(form.caption?.length||0)>260?'warn':''} ${(form.caption?.length||0)>280?'over':''}`}>{form.caption?.length||0}/280</div></div>
          {/* F7: Source links with URL hints */}
          <div className="form-group"><label className="form-label">Source Links (one per line)</label><textarea value={form.sourceLinks} onChange={e => setForm(f => ({...f, sourceLinks: e.target.value}))} rows={2} placeholder="https://defillama.com/protocol/...&#10;https://dune.com/..." />{form.sourceLinks && <div style={{ marginTop: 4 }}>{form.sourceLinks.split('\n').filter(Boolean).map((link, i) => {const isUrl = /^https?:\/\//.test(link.trim()); return (<div key={i} style={{ fontSize: 10, fontFamily: 'var(--font-m)', color: isUrl ? 'var(--muted)' : '#FF5A5A', display: 'flex', alignItems: 'center', gap: 4 }}><span>{isUrl ? '✓' : '⚠'}</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.trim()}</span></div>);})}</div>}</div>
          <div className="form-group"><label className="form-label">Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} placeholder="Research notes, key stats, angle ideas..." /></div>
          <div className="modal-footer">
            {editingIssue && <button className="btn btn-danger" onClick={() => { deleteIssue(editingIssue); setShowModal(false); }}>Delete</button>}
            {editingIssue && <button className="btn btn-secondary" onClick={() => { duplicateIssue(issues.find(i=>i.id===editingIssue)); setShowModal(false); }}>Duplicate</button>}
            {editingIssue && form.frameId && <button className="btn btn-secondary" onClick={() => { openInEditor(form); setShowModal(false); }}>Open in Editor →</button>}
            <div style={{ flex: 1 }} />
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveIssue}>{editingIssue ? 'Update' : 'Create Issue'}</button>
          </div>
        </div>
      </div>
    </>
  );
}
