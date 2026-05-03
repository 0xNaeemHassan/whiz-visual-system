// WhizFrame v8.0 — Complete visual overhaul with unique layouts for all frame types
import { getLayoutComponent } from './LayoutRegistry';
import { prepareLayoutPayload } from './layouts/layoutOrchestrator';
import { TICKER_CONTRACT, normalizeTickerSpeed } from '../../domain/tickerContract';
import { SPINE_DESIGN_TOKENS } from '../../domain/spineDesignTokens';
import { calculateReceiptSummary } from '../../domain/services/receiptCalcService';
import { FrameFooter } from './FrameFooter';
import SemanticChip from '../SemanticChip';
import { resolveRiskAccent } from '../../domain/riskAccentPolicy';

export function FrameShell({ frameRef, frame, theme, content, editMode, selectedEl, onSelectEl, styleOverrides, showGrid, aspectRatio, uploadedImages, bgGradient, patternOverlay, strictWhizMode = false, whizEffects = { glow: true, noise: true, intenseAccent: false } }) {
  const reduceMotion = typeof document !== 'undefined' && document.documentElement?.dataset?.motion === 'reduce';
  const ov = styleOverrides || {};
  const sel = (key, e) => { if (editMode) { e?.stopPropagation(); onSelectEl?.(selectedEl === key ? null : key); } };
  const ec = (key) => editMode ? `wf-editable${selectedEl === key ? ' wf-sel' : ''}` : '';
  const accentResolution = resolveRiskAccent({ frameId: frame?.id, theme, overrides: ov });
  const accentColor = accentResolution.accent;
  const noiseEnabled = !strictWhizMode && whizEffects?.noise !== false;
  const glowEnabled = !reduceMotion && !strictWhizMode && whizEffects?.glow !== false;
  const intenseAccentEnabled = !strictWhizMode && whizEffects?.intenseAccent === true;
  const accentIntensity = intenseAccentEnabled ? '70' : '50';

  const tagStyle = {
    background: ov.tag?.background || `${accentColor}08`,
    border: `1px solid ${ov.tag?.borderColor || accentColor}40`,
    color: ov.tag?.color || accentColor,
    backdropFilter: 'blur(8px)',
  };

  const SectionHead = ({ children }) => (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 600,
      letterSpacing: '0.14em', textTransform: 'uppercase', color: accentColor,
      marginBottom: '12px', marginTop: '22px', display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <span>{children}</span>
      <span style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${accentColor}40, transparent)` }} />
    </div>
  );

  // A1-A7: Render uploaded images with full position/size/rotation/opacity controls
  const renderUploadedImages = () => {
    if (!uploadedImages) return null;
    return ['logo', 'hero', 'badge'].map(key => {
      const img = uploadedImages[key];
      if (!img?.dataUrl || img.visible === false) return null;
      const defaults = key === 'logo' ? { x: 90, y: 5, w: 80 } : key === 'hero' ? { x: 50, y: 50, w: 200 } : { x: 90, y: 90, w: 48 };
      const x = img.x ?? defaults.x;
      const y = img.y ?? defaults.y;
      const baseW = key === 'logo' ? 80 : key === 'hero' ? 300 : 48;
      const scale = (img.width ?? 100) / 100;
      const w = baseW * scale;
      return (
        <div key={key} style={{
          position: 'absolute',
          left: `${x}%`, top: `${y}%`,
          transform: `translate(-50%, -50%) rotate(${img.rotation || 0}deg)`,
          width: w, zIndex: img.zIndex || 10,
          opacity: img.opacity ?? 1,
          pointerEvents: editMode ? 'auto' : 'none',
          transition: 'all 0.2s ease',
        }}>
          <img src={img.dataUrl} alt={img.name || key}
            style={{ width: '100%', height: 'auto', objectFit: img.fit || 'contain', borderRadius: key === 'hero' ? 8 : 0 }} />
        </div>
      );
    });
  };

  const {
    resolvedContent,
    resolvedOv,
    resolvedTagText,
    baseTitleSize,
  } = prepareLayoutPayload({ frame, aspectRatio, content, styleOverrides: ov });
  const sep = TICKER_CONTRACT.separator;
  const tickerText = `WHIZ.DEFI${sep}${resolvedContent.date}${sep}ISSUE ${resolvedContent.issueNum}${sep}${resolvedContent.topicTag}${sep}ALPHA UNLOCKED${sep}`;
  const layoutProps = { theme, content: resolvedContent, SectionHead, ov: resolvedOv, editMode, selectedEl, sel, ec, accentColor };
  const LayoutComponent = getLayoutComponent(frame?.layout);


  return (
    <div
      ref={frameRef}
      className="whiz-frame"
      role="img"
      aria-label={`Whiz Frame: ${resolvedContent.title}. ${resolvedContent.deck}. Stats: ${(content.stats || []).map(s => `${s.label}: ${s.value}`).join(', ')}`}
      style={{
        width: `${aspectRatio?.w || 1080}px`,
        height: `${aspectRatio?.h || 1350}px`,
        background: bgGradient || ov.frameBg || theme.base,
        fontFamily: fontPairing?.body || "'Inter', sans-serif",
      }}
      onClick={() => { if (editMode) onSelectEl?.(null); }}
    >
      {/* Noise texture — PNG fallback safe */}
      {noiseEnabled && <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, opacity: 0.06,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '128px 128px',
      }} />}

      {/* Radial glow */}
      {glowEnabled && <div style={{
        position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: '80%', height: '40%', pointerEvents: 'none', zIndex: 1,
        background: `radial-gradient(ellipse at center, ${accentColor}06 0%, transparent 70%)`,
      }} />}

      {showGrid && <div className="grid-overlay visible" aria-hidden="true" />}

      {patternOverlay && (
        <div className="wf-cover-safe-zone" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
          background: patternOverlay.css,
          backgroundSize: patternOverlay.size || 'auto',
          opacity: patternOverlay.opacity ?? 0.5,
        }} />
      )}

      {/* Ticker */}
      <div className={`wf-ticker ${ec('ticker')}`}
        style={{
          background: ov.tickerBg || TICKER_CONTRACT.background.default,
          borderBottom: `1px solid ${accentColor}20`,
          backdropFilter: reduceMotion ? 'none' : 'blur(12px)',
          height: `${TICKER_CONTRACT.heightPx}px`,
        }}
        onClick={e => sel('ticker', e)}>
        <span className="wf-ticker-scroll" style={{
          color: ov.tickerColor || accentColor,
          opacity: 0.7,
          animationDuration: `${normalizeTickerSpeed(content.tickerSpeed)}s`,
          animationPlayState: reduceMotion ? 'paused' : 'running',
          fontFamily: TICKER_CONTRACT.typography.fontFamily,
          fontSize: `${TICKER_CONTRACT.typography.fontSizePx}px`,
          fontWeight: TICKER_CONTRACT.typography.fontWeight,
          letterSpacing: `${TICKER_CONTRACT.typography.letterSpacingEm}em`,
          textTransform: TICKER_CONTRACT.typography.textTransform,
          paddingLeft: `${TICKER_CONTRACT.padding.textInlineStartPct}%`,
        }}>{tickerText}{tickerText}</span>
      </div>

      {/* Spine — 5px color bar + rotated label that sits beside it */}
      <div className={`wf-spine ${ec('spine')}`}
        style={{ background: ov.spineColor || accentColor, position: 'absolute', left: SPINE_DESIGN_TOKENS.position.barLeftPx, top: SPINE_DESIGN_TOKENS.position.barTopPx, width: `${SPINE_DESIGN_TOKENS.geometry.barWidthPx}px`, height: '100%', zIndex: 5, boxShadow: `0 0 20px ${accentColor}${accentIntensity}` }}
        onClick={e => sel('spine', e)} />
      <div style={{
        position: 'absolute', left: `${SPINE_DESIGN_TOKENS.position.labelWrapLeftPx}px`, top: SPINE_DESIGN_TOKENS.position.labelWrapTopPx, width: `${SPINE_DESIGN_TOKENS.geometry.labelWrapWidthPx}px`, height: '100%',
        zIndex: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', pointerEvents: 'none',
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: `${SPINE_DESIGN_TOKENS.label.fontSizePx}px`, letterSpacing: `${SPINE_DESIGN_TOKENS.label.letterSpacingEm}em`,
          textTransform: SPINE_DESIGN_TOKENS.label.textTransform, color: ov.spineColor || accentColor, opacity: SPINE_DESIGN_TOKENS.label.opacity,
          transform: `rotate(${SPINE_DESIGN_TOKENS.label.rotationDeg}deg)`, whiteSpace: 'nowrap', fontWeight: SPINE_DESIGN_TOKENS.label.fontWeight,
          userSelect: 'none',
        }}>
          WHIZ DEFI DESK / VOL.{content.volume}
        </span>
      </div>

      <CornerTrims accentColor={accentColor} />

      {/* Header */}
      <div className="wf-header" style={{ flexShrink: 0 }}>
        <div className={`wf-slug ${ec('slug')}`} onClick={e => sel('slug', e)}>
          <span className="wf-slug-line"><span style={{ color: '#5A6478' }}>ISSUE /</span> <span style={{ color: accentColor }}>{resolvedContent.issueNum}</span></span>
          <span className="wf-slug-line"><span style={{ color: '#5A6478' }}>FILED /</span> {content.date}</span>
          <span className="wf-slug-line"><span style={{ color: '#5A6478' }}>DESK /</span> {content.desk}</span>
        </div>
        <div className={`wf-topic-tag ${ec('tag')}`} style={tagStyle} onClick={e => sel('tag', e)}>
          <span style={{ fontSize: '10px', marginRight: '4px' }}>&#9654;</span> {resolvedTagText}
        </div>
      </div>

      {/* Title Slab */}
      <div className="wf-title-slab" style={{ flexShrink: 0 }}>
        <div className={`wf-title ${ec('title')}`}
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: `${resolvedOv.title?.fontSize || baseTitleSize}px`,
            fontWeight: resolvedOv.title?.fontWeight || 700,
            color: resolvedOv.title?.color || '#F4F5F7',
            fontStyle: resolvedOv.title?.italic ? 'italic' : 'normal',
            lineHeight: resolvedOv.title?.lineHeight || 1.05,
            letterSpacing: `${resolvedOv.title?.letterSpacing || -0.02}em`,
            textAlign: resolvedOv.title?.textAlign || 'left',
            opacity: resolvedOv.title?.opacity ?? 1,
          }}
          onClick={e => sel('title', e)}>{resolvedContent.title}</div>
        <div style={{ height: '1px', margin: '18px 0 14px', background: `linear-gradient(90deg, ${accentColor}50, ${ov.ruleBg || '#1E2A3A'}80, transparent)` }} />
        <div className={`wf-deck ${ec('deck')}`}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: `${resolvedOv.deck?.fontSize || 18}px`,
            fontWeight: resolvedOv.deck?.fontWeight || 400,
            color: resolvedOv.deck?.color || '#8B95A3',
            fontStyle: resolvedOv.deck?.italic !== false ? 'italic' : 'normal',
            lineHeight: 1.45,
          }}
          onClick={e => sel('deck', e)}>{resolvedContent.deck}</div>
      </div>

      {/* Content — auto-scroll on overflow instead of clip */}
      <div className="wf-content" style={{ flex: 1, overflow: 'hidden', padding: '22px 22px 20px 28px' }}>
        <LayoutComponent {...layoutProps} />
      </div>

      {renderUploadedImages()}

      <FrameFooter
        content={resolvedContent}
        ov={resolvedOv}
        accentColor={accentColor}
        resolvedContent={resolvedContent}
        ec={ec}
        sel={sel}
      />
    </div>
  );
}


/* ─── CORNER TRIMS ─── */
function CornerTrims({ accentColor }) {
  const mk = (pos) => {
    const s = SPINE_DESIGN_TOKENS.geometry.cornerSizePx;
    const base = { position: 'absolute', width: s, height: s, zIndex: 3, pointerEvents: 'none' };
    const b = `${SPINE_DESIGN_TOKENS.geometry.cornerStrokePx}px solid ${accentColor}50`;
    switch(pos) {
      case 'tl': return { ...base, top: SPINE_DESIGN_TOKENS.geometry.cornerOffsetPx, left: SPINE_DESIGN_TOKENS.geometry.cornerSizePx, borderTop: b, borderLeft: b };
      case 'tr': return { ...base, top: SPINE_DESIGN_TOKENS.geometry.cornerOffsetPx, right: SPINE_DESIGN_TOKENS.geometry.cornerSizePx, borderTop: b, borderRight: b };
      case 'bl': return { ...base, bottom: SPINE_DESIGN_TOKENS.geometry.cornerOffsetPx, left: SPINE_DESIGN_TOKENS.geometry.cornerSizePx, borderBottom: b, borderLeft: b };
      case 'br': return { ...base, bottom: SPINE_DESIGN_TOKENS.geometry.cornerOffsetPx, right: SPINE_DESIGN_TOKENS.geometry.cornerSizePx, borderBottom: b, borderRight: b };
      default: return base;
    }
  };
  return <>{['tl','tr','bl','br'].map(p => <div key={p} style={mk(p)} />)}</>;
}

/* ─── SHARED COMPONENTS ─── */


// P2-04b: Parse sparkline data from a comma-separated string like "4.2,3.8,5.1,4.9,6.2"
function parseSparkData(str) {
  if (!str) return [];
  return str.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
}

// P2-02: StatRibbon — spec-compliant: no boxes, thin vertical rules only
function StatRibbon({ stats, ov, accentColor, maxVisible }) {
  if (!stats?.length) return null;
  const items = stats.slice(0, maxVisible ?? 5);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '12px 0', marginBottom: 18, flexShrink: 0,
      borderTop: `1px solid rgba(255,255,255,0.06)`,
      borderBottom: `1px solid rgba(255,255,255,0.06)`,
    }}>
      {items.map((s, i) => (
        <div key={i} style={{
          flex: 1, textAlign: 'center', padding: '0 14px',
          borderRight: i < items.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)', fontWeight: 400, lineHeight: 1,
            marginBottom: 5,
          }}>{s.label}</div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px',
            fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7',
            lineHeight: 1, letterSpacing: '-0.01em',
          }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

function BigNumber({ content, ov, accentColor }) {
  if (!content.bigLabel && !content.bigValue) return null;
  const hierarchy = resolveBigNumberHierarchy({
    availableWidth: 520,
    availableHeight: 220,
    bigValue: content.bigValue || '',
    unit: content.bigUnit || '',
    label: content.bigLabel || '',
    companionMetrics: Array.isArray(content.stats) ? content.stats.length : 0,
  });
  const bigSize = ov.bigNumber?.fontSize || hierarchy.big;
  const unitSize = ov.bigUnit?.fontSize || hierarchy.unit;
  const labelSize = ov.bigLabel?.fontSize || hierarchy.label;
  return (
    <div style={{ textAlign: 'center', margin: '14px 0', flexShrink: 0 }}>
      {content.bigLabel && (
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: `${labelSize}px`,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)', marginBottom: hierarchy.spacingUnitToLabel,
        }}>{content.bigLabel}</div>
      )}
      <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap: hierarchy.spacingBigToUnit }}>
        <div className="wf-cover-title" style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: `${bigSize}px`,
          fontWeight: 700,
          color: ov.bigNumber?.color || accentColor,
          lineHeight: 0.9, letterSpacing: '-0.03em',
        }}>{content.bigValue}</div>
        {content.bigUnit && (
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: `${unitSize}px`,
            fontWeight: 600,
            color: '#B0BAC8',
            lineHeight: 1,
            marginBottom: Math.max(2, Math.round(unitSize * 0.1)),
          }}>{content.bigUnit}</div>
        )}
      </div>
      {content.bigSub && (
        <div style={{
          fontFamily: "'Inter', sans-serif", fontSize: '14px',
          color: '#8B95A3', marginTop: 8, fontStyle: 'italic',
        }}>{content.bigSub}</div>
      )}
    </div>
  );
}

function BodyText({ content, ov, ec, sel, maxParagraphs }) {
  const paras = resolvedContent.body.split('\n').filter(Boolean);
  const visible = maxParagraphs ? paras.slice(0, maxParagraphs) : paras;
  return (
    <div className={ec?.('body') || ''} onClick={e => sel?.('body', e)}>
      {visible.map((p, i) => (
        <p key={i} style={{
          marginBottom: '18px', fontFamily: "'Inter', sans-serif",
          fontSize: `${resolvedOv.body?.fontSize || 15}px`, color: resolvedOv.body?.color || '#B0BAC8',
          lineHeight: resolvedOv.body?.lineHeight || 1.75,
          textAlign: resolvedOv.body?.textAlign || 'left', opacity: resolvedOv.body?.opacity ?? 1,
        }}>{p}</p>
      ))}
    </div>
  );
}

/* ─── LAYOUT COMPONENTS ─── */


// M-01: HeatmapLayout — shows a 7×4 grid of colored cells (e.g., weekly returns)
function HeatmapLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const CELLS = Array.from({ length: 28 }, (_, i) => {
    const val = rows[i % rows.length]?.col3 || '';
    const num = parseFloat(val);
    const isPos = num >= 0;
    const intensity = Math.min(1, Math.abs(num) / 20) || 0.15;
    return { val, color: isNaN(num) ? '#2a2d35' : isPos ? `rgba(60,230,166,${intensity})` : `rgba(255,90,90,${intensity})` };
  });
  return (
    <>
      <StatRibbon stats={content.stats?.slice(0, 3)} ov={ov} accentColor={accentColor} />
      <SectionHead>RETURN HEATMAP</SectionHead>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, flex: 1 }}>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
          <div key={d} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, color: 'var(--dim,#555)', textAlign: 'center', letterSpacing: '0.05em', paddingBottom: 3 }}>{d}</div>
        ))}
        {CELLS.map((cell, i) => (
          <div key={i} title={cell.val} style={{ background: cell.color, borderRadius: 4, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {cell.val && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, color: '#fff', opacity: 0.8 }}>{cell.val}</span>}
          </div>
        ))}
      </div>
    </>
  );
}

// M-01: CompareLayout — side-by-side two-column comparison (like Bull/Bear but generic)
function CompareLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const leftItems = content.bullPoints || [];
  const rightItems = content.bearPoints || [];
  return (
    <>
      <SectionHead>{content.topicTag || 'COMPARISON'}</SectionHead>
      <div style={{ fontSize: resolvedOv.title?.fontSize || 46, fontWeight: 700, lineHeight: 1.05, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif" }}>
        {resolvedContent.title}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
        <div style={{ padding: 16, borderRadius: 8, background: `${accentColor}06`, border: `1px solid ${accentColor}25` }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
            {content.bigLabel || 'OPTION A'}
          </div>
          {leftItems.map((pt, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
              <span style={{ color: accentColor, fontSize: 14, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>✓</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: resolvedOv.body?.color || '#8B95A3', lineHeight: 1.5 }}>{pt}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: 16, borderRadius: 8, background: 'rgba(139,149,163,0.06)', border: '1px solid rgba(139,149,163,0.15)' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#8B95A3', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
            {content.verdict || 'OPTION B'}
          </div>
          {rightItems.map((pt, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
              <span style={{ color: '#8B95A3', fontSize: 14, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>◦</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: resolvedOv.body?.color || '#8B95A3', lineHeight: 1.5 }}>{pt}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// M-01: ScoreCardLayout — ranked items with a score/grade per item
function ScoreCardLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const scoreColors = { 'A+': '#3CE6A6', A: '#3CE6A6', 'A-': '#5CF0B4', 'B+': '#7B8EF8', B: '#7B8EF8', 'B-': '#9BA8FA', 'C+': '#FFC947', C: '#FFC947', D: '#FF5A5A', F: '#FF3333' };
  return (
    <>
      <StatRibbon stats={content.stats?.slice(0, 4)} ov={ov} accentColor={accentColor} />
      <SectionHead>{content.topicTag || 'SCORECARD'}</SectionHead>
      <div style={{ fontSize: resolvedOv.title?.fontSize ? Math.min(resolvedOv.title.fontSize, 40) : 40, fontWeight: 700, lineHeight: 1.05, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif" }}>
        {resolvedContent.title}
      </div>
      <div style={{ flex: 1 }}>
        {rows.map((row, i) => {
          const grade = row.col5 || row.col4 || '';
          const gradeColor = scoreColors[grade] || '#8B95A3';
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#555', width: 18, textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: resolvedOv.title?.color || '#F4F5F7' }}>{row.col1}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#555', marginTop: 2 }}>{row.col2} · {row.col3}</div>
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: gradeColor, background: `${gradeColor}15`, borderRadius: 6, padding: '4px 10px', flexShrink: 0 }}>{grade || '-'}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// M-01: QuoteLayout — large pull-quote with attribution
function QuoteLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  return (
    <>
      <SectionHead>{content.topicTag || 'INSIGHT'}</SectionHead>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ color: accentColor, fontSize: 64, lineHeight: 0.8, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, marginBottom: 8, opacity: 0.6 }}>"</div>
        <div className="wf-cover-title" style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: Math.min(resolvedOv.title?.fontSize || 40, 40),
          fontWeight: 700,
          lineHeight: 1.2,
          color: resolvedOv.title?.color || '#F4F5F7',
          marginBottom: 24,
        }}>
          {resolvedContent.title}
        </div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: resolvedOv.deck?.color || '#8B95A3', lineHeight: 1.6, marginBottom: 24 }}>
          {resolvedContent.deck}
        </div>
        {resolvedContent.body && (
          <div style={{ padding: '12px 16px', borderLeft: `2px solid ${accentColor}`, background: `${accentColor}06`, borderRadius: '0 6px 6px 0' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: accentColor }}>{content.handle || '@source'}</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#8B95A3', marginTop: 2 }}>{resolvedContent.body.slice(0, 120)}</div>
          </div>
        )}
      </div>
      <StatRibbon stats={content.stats?.slice(0, 3)} ov={ov} accentColor={accentColor} />
    </>
  );
}


// ─── TierListLayout (Frame 21) ──────────────────────────────────────────────
// S/A/B/C/D rows of items, each tier color-coded
function TierListLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const TIER_ORDER = ['S','A','B','C','D'];
  const TIER_BG = {
    S: '#E5B23A22', A: '#3CE6A622', B: '#7B8EF822',
    C: '#9DB4D022', D: '#FF5A5A22',
  };
  const TIER_ACC = {
    S: '#E5B23A', A: '#3CE6A6', B: '#7B8EF8',
    C: '#9DB4D0', D: '#FF5A5A',
  };
  // Group rows by tier
  const grouped = TIER_ORDER.reduce((acc, t) => {
    acc[t] = rows.filter(r => (r.col2 || '').toUpperCase() === t || (r.col5 || '').toUpperCase() === t);
    return acc;
  }, {});
  // Fallback: divide rows evenly if no tier assignment
  const hasTiers = Object.values(grouped).some(a => a.length > 0);
  const displayTiers = hasTiers ? TIER_ORDER.filter(t => grouped[t].length > 0)
    : TIER_ORDER.slice(0, Math.min(5, rows.length));
  return (
    <>
      <SectionHead>{content.topicTag || 'TIER LIST'}</SectionHead>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 36, fontWeight: 700, lineHeight: 1.05,
        color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 10,
      }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', marginBottom: 16, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1 }}>
        {displayTiers.map((tier) => {
          const items = hasTiers ? grouped[tier] : rows.filter((_, i) => i % TIER_ORDER.length === TIER_ORDER.indexOf(tier));
          const acc = TIER_ACC[tier] || accentColor;
          return (
            <div key={tier} style={{
              display: 'flex', alignItems: 'stretch', marginBottom: 6, borderRadius: 6, overflow: 'hidden',
              border: `1px solid ${acc}20`,
            }}>
              <div style={{
                width: 36, background: TIER_BG[tier] || `${accentColor}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: acc }}>{tier}</span>
              </div>
              <div style={{
                flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 10px',
                background: 'rgba(255,255,255,0.02)',
                alignItems: 'center', minHeight: 40,
              }}>
                {items.length > 0 ? items.map((it, j) => (
                  <span key={j} style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600,
                    color: '#F4F5F7', background: 'rgba(255,255,255,0.06)',
                    padding: '3px 10px', borderRadius: 20,
                  }}>{it.col1 || it.col3 || `Item ${j+1}`}</span>
                )) : (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3A4560' }}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#5A6478',
        paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 8,
      }}>{resolvedContent.body?.split('\n')[0] || 'Criteria: TVL × team × product × momentum'}</div>
    </>
  );
}

// ─── PostmortemLayout (Frame 25) ────────────────────────────────────────────
// WHAT HAPPENED / ROOT CAUSE / TIMELINE / RECOVERY / LESSONS
function PostmortemLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const SECTIONS_PM = [
    { key: 'col1', label: 'WHAT HAPPENED' },
    { key: 'col2', label: 'ROOT CAUSE' },
    { key: 'col3', label: 'RECOVERY' },
    { key: 'col4', label: 'LESSON' },
  ];
  const rows = content.tableRows || [];
  return (
    <>
      <div style={{
        display: 'inline-block', padding: '2px 10px', marginBottom: 12,
        background: '#FF5A5A15', border: '1px solid #FF5A5A30', borderRadius: 20,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
        letterSpacing: '0.1em', color: '#FF5A5A', textTransform: 'uppercase',
      }}>▸ POST-MORTEM</div>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 36, fontWeight: 700, lineHeight: 1.05,
        color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 8,
      }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', marginBottom: 18, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SECTIONS_PM.map(({ key, label }, idx) => {
          const value = rows[0]?.[key] || content[key] || (idx === 0 ? resolvedContent.body?.split('\n')[0] : '—');
          return (
            <div key={key} style={{
              padding: '10px 14px',
              background: idx === 1 ? 'rgba(255,90,90,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${idx === 1 ? 'rgba(255,90,90,0.15)' : 'rgba(255,255,255,0.04)'}`,
              borderRadius: 6,
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                letterSpacing: '0.12em', color: idx === 1 ? '#FF5A5A' : accentColor,
                textTransform: 'uppercase', marginBottom: 5,
              }}>{String(idx+1).padStart(2,'0')} / {label}</div>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontSize: 12,
                color: '#C8D0D8', lineHeight: 1.55,
              }}>{value}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── TrustStackLayout (Frame 27) ───────────────────────────────────────────
// Vertical stack: User → Frontend → Contract → Custodian → Chain
function TrustStackLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const DEFAULT_LAYERS = [
    { name: 'USER', trust: 'Self-custody of keys', risk: 'LOW' },
    { name: 'FRONTEND', trust: 'DNS / domain hijack risk', risk: 'MED' },
    { name: 'CONTRACT', trust: 'Audit status & upgradeability', risk: 'HIGH' },
    { name: 'CUSTODIAN', trust: 'Multisig control', risk: 'MED' },
    { name: 'CHAIN', trust: 'Validator set & consensus', risk: 'LOW' },
  ];
  const layers = rows.length >= 3
    ? rows.map((r, i) => ({ name: r.col1 || DEFAULT_LAYERS[i]?.name || `LAYER ${i+1}`, trust: r.col2 || DEFAULT_LAYERS[i]?.trust || '', risk: r.col3 || r.col4 || DEFAULT_LAYERS[i]?.risk || 'MED' }))
    : DEFAULT_LAYERS;
  const RISK_COLOR = { 'LOW': '#3CE6A6', 'MED': '#E5B23A', 'HIGH': '#FF5A5A', 'CRITICAL': '#FF2222' };
  const total = layers.length;
  return (
    <>
      <SectionHead>TRUST STACK ANALYSIS</SectionHead>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif", fontSize: 24,
        fontWeight: 700, lineHeight: 1.1, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 6,
      }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', marginBottom: 16, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {layers.map((layer, i) => {
          const riskAcc = RISK_COLOR[layer.risk?.toUpperCase()] || '#8B95A3';
          const width = `${100 - i * (20 / total)}%`;
          return (
            <div key={i} style={{
              width, alignSelf: 'flex-end',
              padding: '10px 14px',
              background: `linear-gradient(90deg, ${accentColor}08 0%, rgba(255,255,255,0.02) 100%)`,
              border: `1px solid ${accentColor}12`,
              borderRadius: 6, marginBottom: 6,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                letterSpacing: '0.12em', color: accentColor, width: 80, flexShrink: 0,
              }}>{layer.name}</div>
              <div style={{ flex: 1, fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#8B95A3', lineHeight: 1.4 }}>{layer.trust}</div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                color: riskAcc, background: `${riskAcc}18`,
                padding: '3px 8px', borderRadius: 10, flexShrink: 0,
              }}>{layer.risk || 'MED'}</div>
            </div>
          );
        })}
      </div>
      {resolvedContent.body && (
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#5A6478',
          paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>{resolvedContent.body.split('\n')[0]}</div>
      )}
    </>
  );
}

// ─── PitchDeckLayout (Frame 8) ──────────────────────────────────────────────
// Centered logo, one-sentence thesis, 4 stat tiles in a row, editorial body with pull-quote
function PitchDeckLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 16, flexShrink: 0 }}>
        {content.logoUrl
          ? <img src={content.logoUrl} alt="logo" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'contain', margin: '0 auto 10px', display: 'block' }} />
          : <div style={{ width: 48, height: 48, borderRadius: 12, background: `${accentColor}20`, border: `1px solid ${accentColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: accentColor }}>{(content.title || '?').charAt(0)}</div>
        }
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 56, fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7', lineHeight: 1, letterSpacing: '-0.02em' }}>{resolvedContent.title}</div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, color: '#8B95A3', marginTop: 8, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      </div>
      {content.stats?.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexShrink: 0 }}>
          {content.stats.slice(0, 4).map((s, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', padding: '10px 8px',
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${accentColor}15`, borderRadius: 8,
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: '#F4F5F7' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {content.thesis && (
          <div style={{ marginBottom: 10, padding: '10px 12px', border: `1px solid ${accentColor}20`, background: `${accentColor}08`, borderRadius: 8 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.14em', color: accentColor, marginBottom: 4 }}>THESIS</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#C8D0D8', lineHeight: 1.5 }}>{content.thesis}</div>
          </div>
        )}
        {(resolvedContent.body || '').split('\n\n').slice(0, 2).map((para, i) => (
          <div key={i} style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', lineHeight: 1.65, marginBottom: 14 }}>{para}</div>
        ))}
        {(content.mechanismSteps?.length > 0 || content.evidencePoints?.length > 0 || content.riskNotes?.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <MiniList title="MECHANISM" items={content.mechanismSteps} color={accentColor} />
            <MiniList title="EVIDENCE" items={content.evidencePoints} color="#3CE6A6" />
            <MiniList title="RISKS" items={content.riskNotes} color="#FF8A3D" />
          </div>
        )}
        {content.pullQuote && (
          <div style={{ padding: '12px 16px', borderLeft: `3px solid ${accentColor}`, background: `${accentColor}08`, borderRadius: '0 6px 6px 0', margin: '14px 0' }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: '#F4F5F7', fontStyle: 'italic' }}>"{content.pullQuote}"</div>
          </div>
        )}
      </div>
    </>
  );
}

function MiniList({ title, items = [], color }) {
  if (!items?.length) return null;
  return (
    <div style={{ padding: '8px 10px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.12em', color, marginBottom: 4 }}>{title}</div>
      {items.slice(0, 3).map((item, i) => (
        <div key={i} style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#8B95A3', lineHeight: 1.45, marginBottom: 3 }}>• {item}</div>
      ))}
    </div>
  );
}

// ─── MechanismLayout (Frame 12) ─────────────────────────────────────────────
// 6-step horizontal flow with numbered hexagonal nodes
function MechanismLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const steps = rows.length > 0
    ? rows.map((r, i) => ({ num: i + 1, title: r.col1, detail: r.col2 || r.col3 }))
    : Array.from({ length: 6 }, (_, i) => ({ num: i + 1, title: `Step ${i+1}`, detail: 'Description goes here' }));

  return (
    <>
      <SectionHead>MECHANISM</SectionHead>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif", fontSize: 36,
        fontWeight: 700, lineHeight: 1.05, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 6,
      }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', marginBottom: 20, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {steps.slice(0, 6).map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', paddingBottom: i < steps.length - 1 ? 12 : 0 }}>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div style={{
                position: 'absolute', left: 15, top: 32, width: 2, height: 'calc(100% - 12px)',
                background: `linear-gradient(180deg, ${accentColor}40, ${accentColor}10)`,
              }} />
            )}
            {/* Step number node */}
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: i === 0 ? accentColor : 'transparent',
              border: `2px solid ${accentColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: i === 0 ? '#090D10' : accentColor }}>
                {String(step.num).padStart(2,'0')}
              </span>
            </div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: '#F4F5F7', marginBottom: 2 }}>{step.title}</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#8B95A3', lineHeight: 1.5 }}>{step.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}


// ─── ThesisLayout (Frame 42) ────────────────────────────────────────────────
// Magazine cover: massive headline, deck, long essay column
// Shared helper for layout-level title sizing
function getTitleFontSizeForLayout(title, defaultSize) {
  if (!title) return defaultSize;
  const len = title.length;
  if (len < 18) return Math.min(defaultSize, 84);
  if (len < 30) return Math.min(defaultSize, 56);
  if (len < 50) return Math.min(defaultSize, 36);
  return Math.min(defaultSize, 24);
}
function ThesisLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const paragraphs = (resolvedContent.body || '').split('\n\n').filter(Boolean);
  return (
    <>
      <div style={{ flexShrink: 0 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          letterSpacing: '0.18em', color: accentColor, textTransform: 'uppercase', marginBottom: 14,
        }}>▸ THESIS</div>
        <div className="wf-cover-title" style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: getTitleFontSizeForLayout(content.title, 56),
          fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em',
          color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 16,
        }}>{resolvedContent.title}</div>
        <div style={{ height: 1, background: `linear-gradient(90deg, ${accentColor}, transparent)`, marginBottom: 14 }} />
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, color: '#8B95A3', fontStyle: 'italic', lineHeight: 1.4, marginBottom: 20 }}>
          {resolvedContent.deck}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {paragraphs.slice(0, 3).map((para, i) => (
          <div key={i} style={{
            fontFamily: "'Inter', sans-serif", fontSize: 14,
            color: i === 0 ? '#C8D0D8' : '#8B95A3',
            lineHeight: 1.7, marginBottom: 14,
            fontWeight: i === 0 ? 500 : 400,
          }}>{para}</div>
        ))}
      </div>
      {content.handle && (
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: accentColor, marginTop: 10 }}>
          — {content.handle}
        </div>
      )}
    </>
  );
}


// ─── CoverStoryLayout (Frame 50) ────────────────────────────────────────────
// Quarterly flagship: full-bleed treatment, volume badge, single massive headline
function CoverStoryLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const safeZone = FRAME_CONSTRAINTS[50]?.safeZone;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Hero image or gradient fill */}
      {content.heroUrl ? (
        <img src={content.heroUrl} alt="hero" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25, borderRadius: 6 }} />
      ) : (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 6,
          background: `radial-gradient(ellipse at 30% 40%, ${accentColor}20 0%, transparent 70%)`,
        }} />
      )}
      {props.editMode && safeZone && (
        <div style={{
          position: 'absolute',
          left: `${safeZone.xPct}%`,
          top: `${safeZone.yPct}%`,
          width: `${safeZone.widthPct}%`,
          height: `${safeZone.heightPct}%`,
          border: '1px dashed rgba(244,245,247,0.6)',
          background: 'rgba(15,19,24,0.08)',
          zIndex: 2,
          pointerEvents: 'none',
        }} />
      )}
      {/* Volume badge */}
      <div style={{
        position: 'relative', zIndex: 1,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
        letterSpacing: '0.2em', color: accentColor,
        textTransform: 'uppercase', marginBottom: 'auto', paddingTop: 8,
      }}>VOL.{content.volume || 'I'} ISSUE {content.issueNum || '001'}</div>
      {/* Main headline — takes most vertical space */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div className="wf-cover-title" style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: getTitleFontSizeForLayout(content.title, 84),
          fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.03em',
          color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 16,
        }}>{resolvedContent.title}</div>
        <div style={{ height: 2, background: accentColor, width: '40%', marginBottom: 16 }} />
        <div className="wf-cover-deck" style={{
          fontFamily: "'Inter', sans-serif", fontSize: 18,
          color: '#8B95A3', fontStyle: 'italic', lineHeight: 1.45, maxWidth: '80%',
        }}>{resolvedContent.deck}</div>
        {content.handle && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: accentColor, marginTop: 12, letterSpacing: '0.1em' }}>
            {content.handle} ▸ QUARTERLY COVER
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ReceiptLayout (Frame 49) ────────────────────────────────────────────────
// Printed paper receipt: mono throughout, itemized cost list
function ReceiptLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const summary = calculateReceiptSummary(rows);
  const dashes = '─'.repeat(32);
  const fmtUsd = (value) => `${value >= 0 ? '+' : '-'}$${Math.abs(value).toFixed(2)}`;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', fontFamily: "'JetBrains Mono', monospace" }}>
      <div style={{ textAlign: 'center', marginBottom: 16, flexShrink: 0 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', color: accentColor, textTransform: 'uppercase', marginBottom: 6 }}>
          *** WHIZ DEFI DESK ***
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#F4F5F7', letterSpacing: '0.1em' }}>
          {content.topicTag || 'THE RECEIPT'}
        </div>
        <div style={{ fontSize: 10, color: '#5A6478', marginTop: 4 }}>{content.date}</div>
        <div style={{ fontSize: 10, color: '#3A4560', marginTop: 8 }}>{dashes}</div>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#8B95A3', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ flex: 1 }}>ITEM</span>
        <span style={{ width: 80, textAlign: 'right' }}>VALUE</span>
      </div>
      <div style={{ fontSize: 10, color: '#3A4560', marginBottom: 8 }}>{dashes}</div>
      <div style={{ flex: 1 }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#F4F5F7', fontWeight: 600 }}>{row.col1}</div>
              {row.col2 && <div style={{ fontSize: 10, color: '#5A6478', marginTop: 2 }}>{row.col2}</div>}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 12, color: row.col4 === 'benefit' ? accentColor : row.col4 === 'risk' ? '#FF5A5A' : '#F4F5F7', fontWeight: 600 }}>{row.col3 || fmtUsd(summary.rows[i]?.amount || 0)}</div>
              {summary.rows[i]?.isManualMismatch && <div style={{ fontSize: 9, color: '#FFB020', marginTop: 2 }}>⚠ manual fee mismatch</div>}
            </div>
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize: 10, color: '#3A4560', margin: '8px 0' }}>{dashes}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#8B95A3' }}>SUBTOTAL FEES</span>
          <span style={{ fontSize: 12, color: '#FF5A5A', fontWeight: 700 }}>-${summary.subtotalFees.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#8B95A3' }}>TOTAL BENEFITS</span>
          <span style={{ fontSize: 12, color: accentColor, fontWeight: 700 }}>+${summary.totalBenefits.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#8B95A3' }}>NET RESULT</span>
          <span style={{ fontSize: 12, color: summary.netResult >= 0 ? accentColor : '#FF5A5A', fontWeight: 700 }}>{fmtUsd(summary.netResult)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#8B95A3' }}>IMPLIED SLIPPAGE</span>
          <span style={{ fontSize: 12, color: '#F4F5F7', fontWeight: 700 }}>{summary.impliedSlippageBps === null ? '—' : `${summary.impliedSlippageBps.toFixed(1)} bps`}</span>
        </div>
        {summary.hasManualMismatch && <div style={{ fontSize: 10, color: '#FFB020', marginBottom: 6 }}>⚠ One or more feeUsd values are inconsistent with amount×bps.</div>}
        <div style={{ fontSize: 10, color: '#3A4560', marginBottom: 8 }}>{dashes}</div>
        <div style={{ textAlign: 'center', fontSize: 10, color: '#5A6478' }}>
          THANK YOU FOR BEING DEFI-PILLED
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: accentColor, marginTop: 4, letterSpacing: '0.1em' }}>
          {content.handle || '@0xWhizMiz'}
        </div>
      </div>
    </div>
  );
}

// ─── GlossaryLayout (Frame 47) ──────────────────────────────────────────────
// Two-column A-Z: mono term + sans definition
function GlossaryLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const letterSections = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  const normalizeGroup = (row) => {
    const explicit = `${row?.group || ''}`.trim().toUpperCase();
    if (/^[A-Z]$/.test(explicit)) return explicit;
    const term = `${row?.term || row?.col1 || ''}`.trim();
    const first = term.charAt(0).toUpperCase();
    return /^[A-Z]$/.test(first) ? first : '#';
  };

  const normalizedRows = rows
    .map((row) => {
      const term = `${row?.term || row?.col1 || ''}`.trim();
      const definition = `${row?.definition || row?.col2 || ''}`.trim();
      const group = normalizeGroup(row);
      return { ...row, term, definition, group };
    })
    .filter((row) => row.term || row.definition)
    .sort((a, b) => {
      if (a.group === '#' && b.group !== '#') return 1;
      if (b.group === '#' && a.group !== '#') return -1;
      return a.term.localeCompare(b.term);
    });

  const sections = [...letterSections, '#']
    .map((letter) => ({ letter, rows: normalizedRows.filter((row) => row.group === letter) }))
    .filter((section) => section.rows.length > 0);

  const mid = Math.ceil(sections.length / 2);
  const columns = [sections.slice(0, mid), sections.slice(mid)];

  return (
    <>
      <SectionHead>{content.topicTag || 'GLOSSARY'}</SectionHead>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 6 }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', marginBottom: 16, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px', overflow: 'hidden' }}>
        {columns.map((column, ci) => (
          <div key={ci}>
            {column.map((section) => (
              <div key={section.letter} style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: accentColor, marginBottom: 6 }}>
                  {section.letter}
                </div>
                {section.rows.map((row, i) => (
                  <div key={`${section.letter}-${i}`} style={{ display: 'flex', gap: 10, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: accentColor, width: 80, flexShrink: 0, paddingTop: 1 }}>
                      {row.term}
                    </div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#8B95A3', lineHeight: 1.5, flex: 1 }}>
                      {row.definition}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── MatrixLayout (Frame 18) ────────────────────────────────────────────────
// 2×2 quadrant chart — plot protocols by 2 dimensions
function MatrixLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  // col1=name, col2=x-val (0-100), col3=y-val (0-100), col4=quadrant label
  const xLabel = content.tableHeaders?.[1] || 'YIELD';
  const yLabel = content.tableHeaders?.[2] || 'RISK';
  return (
    <>
      <SectionHead>{content.topicTag || 'MATRIX'}</SectionHead>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 4 }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', marginBottom: 12, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Quadrant grid */}
        <div style={{ position: 'relative', width: '90%', height: '90%' }}>
          {/* Axis lines */}
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          {/* Quadrant backgrounds */}
          {[
            { top: '0%', left: '50%', label: 'HIGH YIELD / HIGH RISK', color: '#FF5A5A' },
            { top: '0%', left: '0%', label: 'HIGH YIELD / LOW RISK', color: accentColor },
            { top: '50%', left: '50%', label: 'LOW YIELD / HIGH RISK', color: '#FF8A3D' },
            { top: '50%', left: '0%', label: 'LOW YIELD / LOW RISK', color: '#5A6478' },
          ].map((q, i) => (
            <div key={i} style={{
              position: 'absolute', top: q.top, left: q.left, width: '50%', height: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${q.color}06`,
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: `${q.color}40`, letterSpacing: '0.1em', textAlign: 'center', padding: 4 }}>{q.label}</span>
            </div>
          ))}
          {/* Data points */}
          {rows.map((row, i) => {
            const x = parseFloat(row.col2) || 50;
            const y = parseFloat(row.col3) || 50;
            return (
              <div key={i} style={{
                position: 'absolute',
                left: `${x}%`, top: `${100 - y}%`,
                transform: 'translate(-50%, -50%)',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: accentColor, border: '2px solid rgba(255,255,255,0.3)',
                }} title={row.col1} />
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                  color: '#F4F5F7', whiteSpace: 'nowrap',
                  position: 'absolute', left: '50%', top: -16, transform: 'translateX(-50%)',
                  background: 'rgba(9,13,16,0.85)', padding: '1px 4px', borderRadius: 3,
                }}>{row.col1}</div>
              </div>
            );
          })}
          {/* Axis labels */}
          <div style={{ position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#5A6478', letterSpacing: '0.1em' }}>{xLabel} →</div>
          <div style={{ position: 'absolute', left: -22, top: '50%', transform: 'translateY(-50%) rotate(-90deg)', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#5A6478', letterSpacing: '0.1em' }}>↑ {yLabel}</div>
        </div>
      </div>
    </>
  );
}

// ─── ThreatModelLayout (Frame 23) ──────────────────────────────────────────
// 4 quadrants: Smart Contract / Economic / Governance / Operational
// Each has threats with ●●●○○ severity dots
function ThreatModelLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const QUADRANTS = [
    { key: 'sc', label: 'SMART CONTRACT', color: '#FF5A5A', items: rows.filter((_, i) => i % 4 === 0) },
    { key: 'ec', label: 'ECONOMIC', color: '#FF8A3D', items: rows.filter((_, i) => i % 4 === 1) },
    { key: 'go', label: 'GOVERNANCE', color: '#E5B23A', items: rows.filter((_, i) => i % 4 === 2) },
    { key: 'op', label: 'OPERATIONAL', color: '#9DB4D0', items: rows.filter((_, i) => i % 4 === 3) },
  ];
  const SeverityDots = ({ level }) => {
    const n = parseInt(level) || 3;
    return (
      <span>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} style={{ color: i < n ? '#FF5A5A' : '#2A3040', fontSize: 8 }}>●</span>
        ))}
      </span>
    );
  };
  return (
    <>
      <SectionHead>THREAT MODEL</SectionHead>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 6 }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', marginBottom: 14, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {QUADRANTS.map(q => (
          <div key={q.key} style={{ padding: '10px 12px', background: `${q.color}08`, border: `1px solid ${q.color}20`, borderRadius: 8 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.12em', color: q.color, marginBottom: 10, textTransform: 'uppercase' }}>{q.label}</div>
            {(q.items.length > 0 ? q.items : [{ col1: 'Reentrancy', col2: 'Flash loan attack', col3: '4' }, { col1: 'Oracle manipulation', col2: 'Price feed exploit', col3: '3' }]).slice(0, 3).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#C8D0D8', lineHeight: 1.3 }}>{item.col1}</div>
                <SeverityDots level={item.col3 || item.col4 || '3'} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── FailureTreeLayout (Frame 24) ──────────────────────────────────────────
// Top: headline outcome → branches downward into causes
function FailureTreeLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const ROOT_EVENT = content.title || 'DEPEG EVENT';
  const CAUSES = rows.length > 0
    ? rows.map(r => ({ cause: r.col1, detail: r.col2, subcauses: [r.col3, r.col4].filter(Boolean) }))
    : [
        { cause: 'Liquidity Drain', detail: 'Massive redemptions exceeded reserves', subcauses: ['Bank run dynamics', 'No circuit breaker'] },
        { cause: 'Oracle Failure', detail: 'Price feed manipulation exploited', subcauses: ['Single oracle dependency'] },
        { cause: 'Governance Lag', detail: 'Emergency response too slow', subcauses: ['48h timelock', 'Low voter participation'] },
      ];
  return (
    <>
      <SectionHead>FAILURE TREE</SectionHead>
      {/* Root event */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          display: 'inline-block', padding: '10px 20px',
          background: '#FF5A5A18', border: '2px solid #FF5A5A50',
          borderRadius: 8, fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 18, fontWeight: 700, color: '#FF5A5A',
        }}>{ROOT_EVENT}</div>
        <div style={{ width: 2, height: 16, background: 'rgba(255,90,90,0.3)', margin: '0 auto' }} />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#FF5A5A50', letterSpacing: '0.1em' }}>ROOT CAUSE ANALYSIS</div>
      </div>
      <div style={{ display: 'flex', gap: 10, flex: 1 }}>
        {CAUSES.slice(0, 3).map((cause, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Connector line */}
            <div style={{ height: 12, display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 2, background: `${accentColor}30` }} />
            </div>
            <div style={{ padding: '8px 10px', background: `${accentColor}0A`, border: `1px solid ${accentColor}20`, borderRadius: 6 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: accentColor, marginBottom: 4 }}>{cause.cause}</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#8B95A3', lineHeight: 1.4 }}>{cause.detail}</div>
            </div>
            {cause.subcauses.map((sub, j) => sub && (
              <div key={j} style={{ marginLeft: 8, padding: '5px 8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4 }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#5A6478', lineHeight: 1.3 }}>└ {sub}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── FounderLayout (Frame 14) ───────────────────────────────────────────────
// Top: portrait + name/role | Bottom: 3 quotes + KEY SHIPS timeline
function FounderLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const quotes = rows.filter((_, i) => i < 3);
  const ships = rows.slice(3);
  return (
    <>
      {/* Top: profile */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexShrink: 0 }}>
        {content.heroUrl
          ? <img src={content.heroUrl} alt="founder" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${accentColor}40` }} />
          : <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${accentColor}18`, border: `2px solid ${accentColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: accentColor, flexShrink: 0 }}>{(content.handle || '?').charAt(0).toUpperCase()}</div>
        }
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: '#F4F5F7', lineHeight: 1 }}>{resolvedContent.title}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: accentColor, marginTop: 4, letterSpacing: '0.1em' }}>{content.topicTag || 'FOUNDER'}</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#8B95A3', marginTop: 4 }}>{resolvedContent.deck}</div>
        </div>
      </div>
      {/* Quotes */}
      {quotes.length > 0 && (
        <>
          <SectionHead>KEY QUOTES</SectionHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: quotes.length > 0 && ships.length === 0 ? 1 : 'none' }}>
            {quotes.map((q, i) => (
              <div key={i} style={{ padding: '8px 12px', borderLeft: `2px solid ${accentColor}60`, background: `${accentColor}06` }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#C8D0D8', fontStyle: 'italic', lineHeight: 1.5 }}>"{q.col1}"</div>
                {q.col2 && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#5A6478', marginTop: 4 }}>— {q.col2}</div>}
              </div>
            ))}
          </div>
        </>
      )}
      {/* Ships timeline */}
      {ships.length > 0 && (
        <>
          <SectionHead>KEY SHIPS</SectionHead>
          <div style={{ flex: 1 }}>
            {ships.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: accentColor, width: 50, flexShrink: 0 }}>{s.col2}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#C8D0D8' }}>{s.col1}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ─── AnatomyLayout (Frame 9) ────────────────────────────────────────────────
// Labeled diagram: center element with callout lines
function AnatomyLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const components = rows.length > 0
    ? rows.map((r, i) => ({ label: r.col1, desc: r.col2, position: i }))
    : [
        { label: 'VAULT', desc: 'Holds user deposits, enforces withdrawal limits', position: 0 },
        { label: 'ORACLE', desc: 'Feeds real-time price data from Chainlink', position: 1 },
        { label: 'CONTROLLER', desc: 'Routes rebalances to yield strategies', position: 2 },
        { label: 'STRATEGY', desc: 'Deploys capital to integrated protocols', position: 3 },
      ];
  const positions = [
    { top: '15%', left: '60%' }, { top: '40%', left: '70%' },
    { top: '65%', left: '60%' }, { top: '15%', left: '5%' },
    { top: '40%', left: '0%' }, { top: '65%', left: '5%' },
  ];
  return (
    <>
      <SectionHead>ANATOMY</SectionHead>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 6 }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', marginBottom: 12, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1, position: 'relative', minHeight: 200 }}>
        {/* Center node */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 80, height: 80, borderRadius: '50%',
          border: `2px solid ${accentColor}`,
          background: `${accentColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2,
        }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, color: accentColor, textAlign: 'center', padding: 4 }}>
            {(content.title || '').split(' ')[0]?.slice(0, 6)}
          </span>
        </div>
        {/* Callout labels */}
        {components.slice(0, 6).map((comp, i) => {
          const pos = positions[i] || { top: `${10 + i * 15}%`, left: '5%' };
          const isRight = i < 3;
          return (
            <div key={i} style={{
              position: 'absolute', ...pos,
              maxWidth: '35%',
              background: 'rgba(9,13,16,0.85)',
              border: `1px solid ${accentColor}20`,
              borderRadius: 4, padding: '5px 8px',
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: accentColor, letterSpacing: '0.1em', marginBottom: 2 }}>{comp.label}</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#8B95A3', lineHeight: 1.4 }}>{comp.desc}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}


// ─── FlowLayout (Frame 40) ─────────────────────────────────────────────────
// "$1,000 USDC starts here →" path through DeFi strategy
function FlowLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const steps = rows.length > 0
    ? rows.map(r => ({ label: r.col1, amount: r.col2, note: r.col3, action: r.col4 }))
    : [
        { label: 'START', amount: '$1,000 USDC', note: 'Initial capital', action: 'DEPOSIT' },
        { label: 'BRIDGE', amount: '$998.50', note: 'Bridge to Arbitrum', action: 'TRANSFER' },
        { label: 'SWAP', amount: '$997.20', note: 'USDC → stETH via 1inch', action: 'SWAP' },
        { label: 'STAKE', amount: '0.412 stETH', note: 'Pendle yield split', action: 'STAKE' },
        { label: 'HARVEST', amount: '$1,043', note: 'After 30d + points', action: 'CLAIM' },
      ];
  const ARROW_COLOR = `${accentColor}60`;
  return (
    <>
      <SectionHead>YIELD FLOW</SectionHead>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 6 }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', marginBottom: 16, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {steps.map((step, i) => (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Step badge */}
              <div style={{
                width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                background: i === steps.length - 1 ? accentColor : `${accentColor}15`,
                border: `1px solid ${accentColor}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: i === steps.length - 1 ? '#090D10' : accentColor, letterSpacing: '0.08em' }}>
                  {step.action?.slice(0, 4) || String(i+1).padStart(2,'0')}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: i === steps.length - 1 ? accentColor : '#F4F5F7' }}>{step.amount}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#5A6478', letterSpacing: '0.08em' }}>{step.label} · {step.note}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: ARROW_COLOR }}>▸</div>
              )}
            </div>
            {i < steps.length - 1 && (
              <div style={{ marginLeft: 16, width: 2, height: 8, background: `${accentColor}20` }} />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── BracketLayout (Frame 38) ──────────────────────────────────────────────
// Tournament-style: 8 strategies → 4 → 2 → WINNER
function BracketLayout(props) {
  const { content, accentColor, SectionHead } = props;
  const progression = computeBracketProgression(content);
  const round1 = progression.bracketRound1 || [];
  const round2 = progression.bracketRound2 || [];
  const round3 = progression.bracketRound3 || [];
  const winner = progression.bracketWinner || {};

  const MatchCard = ({ side = {} }) => (
    <div style={{
      padding: '5px 8px', borderRadius: 4, marginBottom: 3,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', minWidth: 114,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, color: '#C8D0D8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {(side.seed ? `#${side.seed} ` : '') + (side.name || '—')}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#8B95A3' }}>{side.score || '—'}</div>
      </div>
    </div>
  );

  const MatchPair = ({ match }) => <><MatchCard side={{ seed: match.leftSeed, name: match.leftName, score: match.leftScore }} /><MatchCard side={{ seed: match.rightSeed, name: match.rightName, score: match.rightScore }} /></>;

  return (
    <>
      <SectionHead>BRACKET</SectionHead>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 4 }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', marginBottom: 12, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#3A4560', textAlign: 'center', marginBottom: 6 }}>ROUND 1</div>{round1.map((m,i)=><MatchPair key={i} match={m} />)}</div>
        <div style={{ color: `${accentColor}30`, fontSize: 12 }}>▸</div>
        <div style={{ flex: 1 }}><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#3A4560', textAlign: 'center', marginBottom: 6 }}>SEMIS</div>{round2.map((m,i)=><MatchPair key={i} match={m} />)}</div>
        <div style={{ color: `${accentColor}30`, fontSize: 12 }}>▸</div>
        <div style={{ flex: 1 }}><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#3A4560', textAlign: 'center', marginBottom: 6 }}>FINAL</div>{round3.map((m,i)=><MatchPair key={i} match={m} />)}</div>
        <div style={{ color: accentColor, fontSize: 12 }}>★</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: accentColor, textAlign: 'center', marginBottom: 8, letterSpacing: '0.1em' }}>WHIZ PICK</div>
          <div style={{ textAlign: 'center', padding: '12px 8px', background: `${accentColor}18`, border: `2px solid ${accentColor}`, borderRadius: 8 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, color: accentColor }}>
              {(winner.seed ? `#${winner.seed} ` : '') + (winner.name || 'TBD')}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── ThreeLayerLayout (Frame 43) ───────────────────────────────────────────
// Premise / Mechanism / Implication — each tier has its own treatment
function ThreeLayerLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const TIERS = [
    { label: 'PREMISE', sublabel: 'The starting truth', color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.04)', row: rows[0] },
    { label: 'MECHANISM', sublabel: 'Why it works', color: accentColor, bg: `${accentColor}0C`, row: rows[1] },
    { label: 'IMPLICATION', sublabel: 'What it means for you', color: '#F4F5F7', bg: 'rgba(255,255,255,0.06)', row: rows[2] },
  ];
  return (
    <>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 6, flexShrink: 0 }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', marginBottom: 20, fontStyle: 'italic', flexShrink: 0 }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TIERS.map(({ label, sublabel, color, bg, row }, i) => (
          <div key={label} style={{ flex: 1, padding: '14px 16px', background: bg, border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: `${color}40` }}>{String(i+1).padStart(2,'0')}</span>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color }}>{label}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#5A6478', marginTop: 1 }}>{sublabel}</div>
              </div>
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#C8D0D8', lineHeight: 1.65 }}>
              {row?.col1 || (resolvedContent.body || '').split('\n\n')[i] || `${label.toLowerCase()} content goes here.`}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── LongBetLayout (Frame 45) ──────────────────────────────────────────────
// Timeline 2026→2030 with predicted milestones + confidence %
function LongBetLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const events = rows.length > 0
    ? rows.map(r => ({ year: r.col1, event: r.col2, confidence: parseInt(r.col3) || 70 }))
    : [
        { year: '2026', event: 'ETH hits 10x institutional penetration vs 2024', confidence: 75 },
        { year: '2027', event: 'First RWA market exceeds $1T on-chain', confidence: 65 },
        { year: '2028', event: 'Stablecoin daily volume surpasses Visa', confidence: 55 },
        { year: '2029', event: 'On-chain identity becomes DeFi prerequisite', confidence: 45 },
        { year: '2030', event: 'Bitcoin ETF AUM eclipses gold ETF AUM', confidence: 60 },
      ];
  const getConfColor = (c) => c >= 70 ? accentColor : c >= 50 ? '#E5B23A' : '#FF8A3D';
  return (
    <>
      <SectionHead>LONG BETS</SectionHead>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 6 }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', marginBottom: 20, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Timeline spine */}
        <div style={{ position: 'absolute', left: 38, top: 0, bottom: 0, width: 2, background: `linear-gradient(180deg, ${accentColor}, ${accentColor}10)` }} />
        {events.map((ev, i) => {
          const cc = getConfColor(ev.confidence);
          return (
            <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16, position: 'relative' }}>
              {/* Year node */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: '#0F1318', border: `2px solid ${accentColor}60`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
              }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: accentColor }}>{ev.year}</span>
              </div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#F4F5F7', lineHeight: 1.45, marginBottom: 4 }}>{ev.event}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${ev.confidence}%`, background: cc, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: cc, width: 32 }}>{ev.confidence}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── OrgChartLayout (Frame 34) ─────────────────────────────────────────────
// Hierarchy tree: L1 → L2s → L3s → apps, expanding rightward
function OrgChartLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  // col1=name, col2=level (1/2/3/4), col3=parent
  // Group by level
  const byLevel = [1,2,3,4].map(l => rows.filter(r => parseInt(r.col2) === l || (!r.col2 && l === 1)));
  const maxLevel = byLevel.findIndex((g, i) => i > 0 && g.length === 0);
  const levels = maxLevel > 0 ? byLevel.slice(0, maxLevel) : byLevel.filter(g => g.length > 0).slice(0, 4);
  const LEVEL_LABELS = ['LAYER 1', 'LAYER 2', 'APPS', 'SERVICES'];
  return (
    <>
      <SectionHead>ECOSYSTEM HIERARCHY</SectionHead>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 6 }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', marginBottom: 14, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1, display: 'flex', gap: 8 }}>
        {(levels.length > 0 ? levels : [
          [{col1:'Ethereum'},{col1:'Solana'}],
          [{col1:'Arbitrum'},{col1:'Optimism'},{col1:'Base'},{col1:'Polygon'}],
          [{col1:'Aave'},{col1:'Uniswap'},{col1:'Compound'},{col1:'Curve'}],
        ]).map((lvl, li) => (
          <div key={li} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'space-evenly' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#3A4560', textAlign: 'center', letterSpacing: '0.1em', marginBottom: 4 }}>{LEVEL_LABELS[li]}</div>
            {lvl.map((item, ii) => (
              <div key={ii} style={{
                padding: '6px 8px', textAlign: 'center',
                background: li === 0 ? `${accentColor}15` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${li === 0 ? accentColor + '40' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 6,
              }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: li === 0 ? 700 : 400, color: li === 0 ? accentColor : '#C8D0D8' }}>{item.col1}</div>
                {item.col3 && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#5A6478', marginTop: 2 }}>{item.col3}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── PeriodicLayout (Frame 33) ─────────────────────────────────────────────
// Protocol periodic table: abbreviation / full name / TVL / chain group
function PeriodicLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const CHAIN_COLORS = { ETH: '#7B8EF8', SOL: '#3CE6A6', BNB: '#E5B23A', ARB: '#3FE2D6', OP: '#FF5A5A', BASE: '#6FA8FF', POLY: '#B97AFF' };
  return (
    <>
      <SectionHead>PERIODIC TABLE</SectionHead>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 4 }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#8B95A3', marginBottom: 12, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 5, alignContent: 'start' }}>
        {(rows.length > 0 ? rows : Array.from({length:18}, (_,i) => ({col1:`P${i+1}`, col2:`Protocol ${i+1}`, col3:'$1B', col4:'ETH'}))).slice(0,30).map((row, i) => {
          const chain = (row.col4 || 'ETH').toUpperCase();
          const chainColor = CHAIN_COLORS[chain] || accentColor;
          return (
            <div key={i} style={{
              padding: '5px 4px', textAlign: 'center',
              background: `${chainColor}10`, border: `1px solid ${chainColor}25`,
              borderRadius: 4, borderTop: `3px solid ${chainColor}`,
            }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: chainColor, lineHeight: 1 }}>{(row.col1 || '').slice(0,4)}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#F4F5F7', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.col2}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, color: '#5A6478' }}>{row.col3}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, color: chainColor, marginTop: 1 }}>{chain}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── CurveLayout (Frame 39) ────────────────────────────────────────────────
// SVG chart takes 60% of canvas, annotation callouts at inflection points
function CurveLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  // col1=label/date, col2=value, col3=annotation
  const points = rows.length > 0
    ? rows.map((r, i) => ({ label: r.col1, val: parseFloat(r.col2) || 0, note: r.col3 }))
    : [
        { label: 'Jan', val: 1.2, note: null }, { label: 'Feb', val: 1.8, note: null },
        { label: 'Mar', val: 2.9, note: 'Surge: Airdrop season' },
        { label: 'Apr', val: 2.1, note: null }, { label: 'May', val: 1.6, note: 'Exploit -40%' },
        { label: 'Jun', val: 2.4, note: null }, { label: 'Jul', val: 3.8, note: null },
        { label: 'Aug', val: 4.2, note: 'ATH' }, { label: 'Sep', val: 3.6, note: null },
      ];
  const vals = points.map(p => p.val);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals) || 1;
  const W = 320, H = 140, PAD = 10;
  const toX = (i) => PAD + (i / (points.length - 1)) * (W - PAD * 2);
  const toY = (v) => H - PAD - ((v - minV) / (maxV - minV)) * (H - PAD * 2);
  const pathD = points.map((p, i) => `${i===0?'M':'L'}${toX(i).toFixed(1)},${toY(p.val).toFixed(1)}`).join(' ');
  const fillD = pathD + ` L${toX(points.length-1).toFixed(1)},${H} L${toX(0).toFixed(1)},${H} Z`;
  return (
    <>
      <SectionHead>{content.topicTag || 'CHART'}</SectionHead>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 4 }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', marginBottom: 12, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1, position: 'relative' }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={fillD} fill="url(#curve-fill)" />
          <path d={pathD} fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => p.note && (
            <g key={i}>
              <circle cx={toX(i)} cy={toY(p.val)} r={4} fill={accentColor} stroke="#0F1318" strokeWidth="2" />
              <line x1={toX(i)} y1={toY(p.val) - 4} x2={toX(i)} y2={toY(p.val) - 20} stroke={`${accentColor}60`} strokeWidth="1" strokeDasharray="2,2" />
              <rect x={toX(i) - 40} y={toY(p.val) - 35} width={80} height={14} rx="3" fill="rgba(9,13,16,0.9)" />
              <text x={toX(i)} y={toY(p.val) - 24} textAnchor="middle" fill={accentColor} fontSize="8" fontFamily="'JetBrains Mono', monospace">{p.note}</text>
            </g>
          ))}
          {points.map((p, i) => (
            <text key={i} x={toX(i)} y={H + 2} textAnchor="middle" fill="#5A6478" fontSize="8" fontFamily="'JetBrains Mono', monospace">{p.label}</text>
          ))}
        </svg>
      </div>
    </>
  );
}

// ─── FieldGuideLayout (Frame 48) ───────────────────────────────────────────
// Birdwatcher cards: illustration / habitat / diet / spotting tips
function FieldGuideLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const species = rows.length > 0
    ? rows.map(r => ({ name: r.col1, habitat: r.col2, diet: r.col3, tip: r.col4 }))
    : [
        { name: 'Yield Farmer', habitat: 'Ethereum, Arbitrum', diet: 'Liquidity mining rewards', tip: 'Spotted near new protocol launches' },
        { name: 'MEV Bot', habitat: 'All EVM chains', diet: 'Arbitrage, front-running', tip: 'Leaves unusual gas spikes' },
        { name: 'DAO Voter', habitat: 'Governance forums', diet: 'Protocol fees + veToken yields', tip: 'Active during proposal windows' },
        { name: 'Degen', habitat: 'CT, memecoin markets', diet: 'Narrative momentum, >100% APYs', tip: 'Migrates at first sign of bear' },
      ];
  return (
    <>
      <SectionHead>FIELD GUIDE</SectionHead>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 4 }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', marginBottom: 14, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {species.slice(0, 4).map((s, i) => (
          <div key={i} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${accentColor}15`, borderRadius: 8 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: accentColor, marginBottom: 6 }}>{s.name}</div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#5A6478', letterSpacing: '0.1em' }}>HABITAT </span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#8B95A3' }}>{s.habitat}</span>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#5A6478', letterSpacing: '0.1em' }}>DIET </span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#8B95A3' }}>{s.diet}</span>
            </div>
            <div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: accentColor, letterSpacing: '0.1em' }}>TIP </span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#C8D0D8' }}>{s.tip}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── MentalModelLayout (Frame 26) ──────────────────────────────────────────
// Concept + labeled illustration + 3 numbered reads
function MentalModelLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const reads = rows.slice(0, 3);
  return (
    <>
      <SectionHead>MENTAL MODEL</SectionHead>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 6 }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, color: '#8B95A3', marginBottom: 18, fontStyle: 'italic', lineHeight: 1.45 }}>{resolvedContent.deck}</div>
      {/* Concept illustration box */}
      <div style={{
        padding: '16px', background: `${accentColor}06`, border: `1px solid ${accentColor}15`,
        borderRadius: 10, marginBottom: 18, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80,
      }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#C8D0D8', lineHeight: 1.65, textAlign: 'center' }}>
          {(resolvedContent.body || '').split('\n\n')[0] || content.deck}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(reads.length > 0 ? reads : [{col1:'First-order effect'},{col1:'Second-order effect'},{col1:'Third-order effect'}]).map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${accentColor}18`, border: `1px solid ${accentColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: accentColor }}>{i+1}</span>
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#C8D0D8', lineHeight: 1.6, paddingTop: 3 }}>{r.col1}</div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── SubwayLayout (Frame 32) ───────────────────────────────────────────────
// Protocol categories as subway lines, projects as stations
function SubwayLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  // Group by col2 (line/category)
  const lineMap = rows.reduce((acc, r) => {
    const line = r.col2 || 'DEFAULT';
    if (!acc[line]) acc[line] = [];
    acc[line].push(r.col1);
    return acc;
  }, {});
  const SUBWAY_COLORS = ['#3CE6A6','#7B8EF8','#FF5A5A','#E5B23A','#3FE2D6','#B97AFF','#FF8A3D','#9DB4D0'];
  const lines = Object.entries(lineMap.length === 0 && rows.length === 0
    ? { 'LENDING': ['Aave', 'Compound', 'Morpho'], 'DEX': ['Uniswap', 'Curve', 'Balancer'], 'YIELD': ['Pendle', 'Yearn', 'Convex'] }
    : lineMap
  );
  return (
    <>
      <SectionHead>SUBWAY MAP</SectionHead>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 6 }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', marginBottom: 16, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {lines.map(([lineName, stations], li) => {
          const lineColor = SUBWAY_COLORS[li % SUBWAY_COLORS.length];
          return (
            <div key={lineName} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Line label */}
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700,
                color: lineColor, background: `${lineColor}18`, border: `1px solid ${lineColor}30`,
                padding: '3px 8px', borderRadius: 3, flexShrink: 0, letterSpacing: '0.1em',
                width: 60, textAlign: 'center', textTransform: 'uppercase',
              }}>{lineName.slice(0,8)}</div>
              {/* Track */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0, position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: `${lineColor}40`, zIndex: 0 }} />
                <div style={{ display: 'flex', gap: 8, position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
                  {(Array.isArray(stations) ? stations : [stations]).map((station, si) => (
                    <div key={si} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: '#0F1318', border: `1px solid ${lineColor}50`,
                      borderRadius: 12, padding: '3px 8px',
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: lineColor, flexShrink: 0 }} />
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 600, color: '#F4F5F7', whiteSpace: 'nowrap' }}>{station}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}


// ─── ConstellationLayout (Frame 30) ─────────────────────────────────────────
// Protocol logos on a starfield, grouped by category with connecting lines
function ConstellationLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  // col1=name, col2=category, col3=tvl/size, col4=x%, col5=y%
  const CATEGORY_COLORS = {
    'DEX':'#7B8EF8','LENDING':'#3CE6A6','YIELD':'#E5B23A',
    'BRIDGE':'#FF8A3D','STABLE':'#6FA8FF','L2':'#3FE2D6','GOV':'#9DB4D0',
  };
  const defaultNodes = [
    {col1:'Uniswap',col2:'DEX',col4:'25',col5:'30'},
    {col1:'Aave',col2:'LENDING',col4:'60',col5:'20'},
    {col1:'Curve',col2:'DEX',col4:'15',col5:'60'},
    {col1:'Pendle',col2:'YIELD',col4:'70',col5:'55'},
    {col1:'Morpho',col2:'LENDING',col4:'45',col5:'75'},
    {col1:'Lido',col2:'YIELD',col4:'80',col5:'30'},
    {col1:'Stargate',col2:'BRIDGE',col4:'35',col5:'45'},
    {col1:'Arbitrum',col2:'L2',col4:'55',col5:'50'},
  ];
  const nodes = rows.length >= 4 ? rows : defaultNodes;
  const { density, spacing } = getLayoutTuning(content);
  const placedNodes = placeNodes({
    nodes: nodes.map((node, i) => ({
      ...node,
      x: parseFloat(node.col4) || (15 + (i * 12) % 80),
      y: (parseFloat(node.col5) || (30 + (i * 17) % 55)) + 20,
    })),
    bounds: { left: 8, top: 28, right: 92, bottom: 90 },
    nodeSize: { width: 34 * density, height: 34 * density },
    edgePadding: 6 + (12 * spacing),
    minNodeGap: 4 + (10 * spacing),
  });
  // Group by category for connecting lines
  const cats = [...new Set(nodes.map(n => n.col2))];
  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {/* Stars */}
      {Array.from({length: 40}, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(i * 2.5 + 7) % 100}%`,
          top: `${(i * 3.7 + 11) % 100}%`,
          width: i % 5 === 0 ? 2 : 1,
          height: i % 5 === 0 ? 2 : 1,
          borderRadius: '50%',
          background: `rgba(255,255,255,${0.1 + (i % 4) * 0.06})`,
        }} />
      ))}
      {/* Title */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 4 }}>{resolvedContent.title}</div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#8B95A3', fontStyle: 'italic', marginBottom: 8 }}>{resolvedContent.deck}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {cats.map(cat => (
            <span key={cat} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: CATEGORY_COLORS[cat] || accentColor, background: `${CATEGORY_COLORS[cat] || accentColor}15`, padding: '2px 6px', borderRadius: 10 }}>{cat}</span>
          ))}
        </div>
      </div>
      {/* Nodes */}
      {placedNodes.map(({ node, x, y }, i) => {
        const color = CATEGORY_COLORS[node.col2] || accentColor;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${x}%`, top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            textAlign: 'center', zIndex: 1,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `${color}18`, border: `1.5px solid ${color}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 4px',
              boxShadow: `0 0 12px ${color}30`,
            }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, color }}>{(node.col1||'').slice(0,4)}</span>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#8B95A3', whiteSpace: 'nowrap' }}>{node.col1}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── StackLayout (Frame 31) ──────────────────────────────────────────────────
// Settlement → DA → Execution → Apps → Users, logos per layer
function StackLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const LAYERS = [
    { name: 'SETTLEMENT', desc: 'Finality & security', color: '#E5B23A' },
    { name: 'DATA AVAIL.', desc: 'Blob storage & DA', color: '#7B8EF8' },
    { name: 'EXECUTION', desc: 'Rollups & VMs', color: accentColor },
    { name: 'APPLICATIONS', desc: 'DeFi protocols', color: '#3FE2D6' },
    { name: 'USERS', desc: 'Wallets & interfaces', color: '#9DB4D0' },
  ];
  // Group rows by col2 (layer name) or distribute evenly
  const grouped = LAYERS.map((layer, li) => ({
    ...layer,
    items: rows.filter(r => (r.col2||'').toUpperCase().includes(layer.name.split(' ')[0])) ||
           rows.filter((_, i) => i % LAYERS.length === li),
  }));
  return (
    <>
      <SectionHead>TECH STACK</SectionHead>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 4 }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', marginBottom: 14, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {grouped.map((layer, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px',
            background: `${layer.color}08`,
            border: `1px solid ${layer.color}20`,
            borderRadius: 6, borderLeft: `3px solid ${layer.color}`,
          }}>
            <div style={{ width: 90, flexShrink: 0 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: layer.color, letterSpacing: '0.1em' }}>{layer.name}</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#5A6478' }}>{layer.desc}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {layer.items.slice(0, 4).map((item, j) => (
                <span key={j} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, color: '#F4F5F7', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 12 }}>{item.col1}</span>
              ))}
              {layer.items.length === 0 && (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3A4560' }}>Add protocols in table rows (col2={layer.name.split(' ')[0]})</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── TradeRoutesLayout (Frame 35) ────────────────────────────────────────────
// Protocol flow arcs: from-chain → to-chain with volume
function TradeRoutesLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const rows = content.tableRows || [];
  const { density, spacing } = getLayoutTuning(content);
  const HUBS = rows.length > 0
    ? rows
    : [
        { col1:'Ethereum', col2:'Arbitrum', col3:'$4.2B', col4:'Bridge' },
        { col1:'Ethereum', col2:'Base', col3:'$2.1B', col4:'Bridge' },
        { col1:'Arbitrum', col2:'Optimism', col3:'$890M', col4:'DEX' },
        { col1:'Ethereum', col2:'Solana', col3:'$650M', col4:'Wormhole' },
        { col1:'BNB Chain', col2:'Ethereum', col3:'$540M', col4:'cBridge' },
      ];
  const VOL_COLORS = ['#3CE6A6','#7B8EF8','#E5B23A','#FF8A3D','#FF5A5A','#9DB4D0'];
  return (
    <>
      <SectionHead>TRADE ROUTES</SectionHead>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: resolvedOv.title?.color || '#F4F5F7', marginBottom: 4 }}>{resolvedContent.title}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#8B95A3', marginBottom: 16, fontStyle: 'italic' }}>{resolvedContent.deck}</div>
      <div style={{ flex: 1 }}>
        {HUBS.map((route, i) => {
          const color = VOL_COLORS[i % VOL_COLORS.length];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: Math.round(6 + spacing * 8), gap: Math.round(8 + spacing * 4) }}>
              {/* Source */}
              <div style={{ width: 80, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, color: '#F4F5F7', textAlign: 'right', flexShrink: 0 }}>{route.col1}</div>
              {/* Flow arc */}
              <div style={{ flex: 1, position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
                <div style={{ height: Math.max(1, Math.round(1 + (density * 1.6))), background: `linear-gradient(90deg, ${color}60, ${color}, ${color}60)`, flex: 1, borderRadius: 1 }} />
                {/* Arrow */}
                <div style={{ position: 'absolute', right: 0, width: 0, height: 0, borderLeft: `6px solid ${color}`, borderTop: '4px solid transparent', borderBottom: '4px solid transparent' }} />
                {/* Volume label */}
                <div style={{ position: 'absolute', left: '50%', top: -14, transform: 'translateX(-50%)', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color, fontWeight: 700, whiteSpace: 'nowrap', background: '#0F1318', padding: '1px 4px', borderRadius: 3 }}>{route.col3}</div>
                {/* Protocol tag */}
                {route.col4 && <div style={{ position: 'absolute', left: '50%', top: 6, transform: 'translateX(-50%)', fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#5A6478', whiteSpace: 'nowrap' }}>via {route.col4}</div>}
              </div>
              {/* Destination */}
              <div style={{ width: 80, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, color: '#F4F5F7', flexShrink: 0 }}>{route.col2}</div>
            </div>
          );
        })}
        {content.stats?.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 16 }}>
            {content.stats.slice(0, 3).map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: '#F4F5F7' }}>{s.value}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#5A6478', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function BodyLayout(props) {
  const { content, ov, ec, sel, accentColor, SectionHead } = props;
  return (
    <>
      <StatRibbon stats={content.stats} ov={ov} accentColor={accentColor} maxVisible={5} />
      <SectionHead>ANALYSIS</SectionHead>
      <BodyText content={content} ov={ov} ec={ec} sel={sel} />
      <BigNumber content={content} ov={ov} accentColor={accentColor} />
    </>
  );
}

function StatsLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  return (
    <>
      <StatRibbon stats={content.stats} ov={ov} accentColor={accentColor} />
      <SectionHead>KEY METRICS</SectionHead>
      <BigNumber content={content} ov={ov} accentColor={accentColor} />
      <SectionHead>OVERVIEW</SectionHead>
      <BodyText content={props.content} ov={ov} maxParagraphs={2} />
    </>
  );
}

function TableLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const headers = content.tableHeaders || [];
  const rows = content.tableRows || [];
  return (
    <>
      <StatRibbon stats={content.stats?.slice(0, 4)} ov={ov} accentColor={accentColor} />
      <SectionHead>DATA TABLE</SectionHead>
      <div style={{
        border: `1px solid ${accentColor}08`, borderRadius: '8px', overflow: 'hidden',
        background: `linear-gradient(180deg, ${accentColor}03 0%, transparent 100%)`,
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: `${accentColor}06` }}>
              {headers.map((h, i) => (
                <th key={i} style={{
                  padding: '10px 14px', textAlign: 'left',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  borderBottom: `1px solid ${accentColor}20`,
                  color: accentColor, fontWeight: 600,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 1 ? `${accentColor}03` : 'transparent' }}>
                {Object.entries(row).filter(([k])=>k!=='sparkData').map(([k,v], j) => (
                  <td key={j} style={{
                    padding: '10px 14px',
                    borderBottom: i < rows.length - 1 ? `1px solid ${accentColor}06` : 'none',
                    fontFamily: j === 0 ? "'Inter', sans-serif" : "'JetBrains Mono', monospace",
                    fontSize: j === 0 ? '13px' : '12px',
                    color: j === 0 ? (resolvedOv.title?.color || '#F4F5F7') : (resolvedOv.body?.color || '#8B95A3'),
                    fontWeight: j === 0 ? 500 : 400,
                  }}>{v}</td>
                ))}
              
                {row.sparkData && <td style={{padding:'4px 8px',verticalAlign:'middle'}}><Sparkline values={parseSparkData(row.sparkData)} accentColor={accentColor} colorRole="accent" strokeWidth="thin" baseline="none" marker="last" width={56} height={22}/></td>}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function BullBearLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  return (
    <>
      <StatRibbon stats={content.stats?.slice(0, 3)} ov={ov} accentColor={accentColor} />
      <SectionHead>CASE ANALYSIS</SectionHead>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div style={{ padding: '16px', borderRadius: '8px', background: `linear-gradient(180deg, ${accentColor}06 0%, transparent 100%)`, border: `1px solid ${accentColor}20` }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '12px', color: accentColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: accentColor, boxShadow: `0 0 8px ${accentColor}80` }} />BULL CASE
          </div>
          {(content.bullPoints || []).map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#B0BAC8', lineHeight: 1.45 }}>
              <span style={{ color: accentColor, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
              <span>{p}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px', borderRadius: '8px', background: 'linear-gradient(180deg, rgba(255,90,90,0.05) 0%, transparent 100%)', border: '1px solid rgba(255,90,90,0.18)' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '12px', color: '#FF5A5A', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF5A5A', boxShadow: '0 0 8px rgba(255,90,90,0.6)' }} />BEAR CASE
          </div>
          {(content.bearPoints || []).map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#B0BAC8', lineHeight: 1.45 }}>
              <span style={{ color: '#FF5A5A', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>
      {content.verdict && (
        <div style={{ marginTop: '16px', padding: '14px 18px', borderRadius: '8px', background: `${accentColor}06`, border: `1px solid ${accentColor}08` }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', color: accentColor, marginBottom: '8px' }}>WHIZ VERDICT</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#D0D8E4', lineHeight: 1.6 }}>{content.verdict}</div>
        </div>
      )}
    </>
  );
}

function GridLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const items = content.gridItems || content.stats || [];
  const cols = items.length <= 4 ? 2 : items.length <= 9 ? 3 : 4;
  return (
    <>
      <SectionHead>GRID VIEW</SectionHead>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '10px' }}>
        {items.map((item, i) => (
          <div key={i} style={{
            padding: '16px 14px', textAlign: 'center', borderRadius: '8px',
            background: `linear-gradient(180deg, ${accentColor}06 0%, transparent 100%)`,
            border: `1px solid ${accentColor}12`,
          }}>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif", fontSize: items.length > 6 ? '16px' : '20px', fontWeight: 700,
              color: ov.accent?.color || accentColor, marginBottom: '6px',
              textShadow: `0 0 16px ${accentColor}25`,
            }}>{item.value || item}</div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '8.5px', color: '#5A6478',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>{item.label || ''}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function TimelineLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const events = content.timelineEvents || content.stats || [];
  return (
    <>
      <SectionHead>TIMELINE</SectionHead>
      <div style={{ paddingLeft: '24px', position: 'relative' }}>
        <div style={{
          position: 'absolute', left: '6px', top: '4px', bottom: '4px', width: '1.5px',
          background: `linear-gradient(180deg, ${accentColor}50, ${accentColor}06)`,
        }} />
        {events.map((ev, i) => (
          <div key={i} style={{ marginBottom: '20px', position: 'relative' }}>
            <div style={{
              position: 'absolute', left: '-22px', top: '4px', width: '10px', height: '10px',
              borderRadius: '50%', background: accentColor, boxShadow: `0 0 10px ${accentColor}50`,
            }} />
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: accentColor, marginBottom: '5px', letterSpacing: '0.08em' }}>
              {ev.date || ev.label || `EVENT ${i + 1}`}
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#B0BAC8', lineHeight: 1.55 }}>
              {ev.text || ev.value || ev}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function NetworkLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const { density, spacing } = getLayoutTuning(content);
  // B7: Real network visualization using stats as nodes
  const nodes = content.stats || [];
  return (
    <>
      <StatRibbon stats={content.stats?.slice(0, 3)} ov={ov} accentColor={accentColor} />
      <SectionHead>NETWORK MAP</SectionHead>
      {nodes.length > 0 ? (
        <div style={{ position: 'relative', height: '280px', borderRadius: '10px', border: `1px solid ${accentColor}08`, background: `radial-gradient(circle, ${accentColor}05 0%, transparent 70%)`, overflow: 'hidden' }}>
          {/* Central node */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${accentColor}20`, border: `2px solid ${accentColor}60`, fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px', color: accentColor, fontWeight: 700, textAlign: 'center', zIndex: 2,
          }}>
            {content.topicTag?.split(' ')[0] || 'HUB'}
          </div>
          {/* Orbital nodes */}
          {placeNodes({
            nodes: nodes.slice(0, 6).map((n, i) => {
              const angle = (i / Math.min(nodes.length, 6)) * Math.PI * 2 - Math.PI / 2;
              const point = ensureMinEdgeSpacing({
                x: 50 + ((110 * spacing * Math.cos(angle)) / 280) * 100,
                y: 50 + ((95 * spacing * Math.sin(angle)) / 280) * 100,
              }, { left: 12, top: 12, right: 88, bottom: 88 }, 4 + spacing * 6);
              return { ...n, x: point.x, y: point.y };
            }),
            bounds: { left: 12, top: 12, right: 88, bottom: 88 },
            nodeSize: { width: 64 * density, height: 40 * density },
            edgePadding: 4 + (8 * spacing),
            minNodeGap: 3 + (9 * spacing),
          }).map(({ node: n, x, y }, i) => {
            return (
              <div key={i}>
                {/* Connection line */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}>
                  <line x1="50%" y1="50%" x2={`${x}%`} y2={`${y}%`} stroke={`${accentColor}30`} strokeWidth="1" strokeDasharray="4,4" />
                </svg>
                {/* Node */}
                <div style={{
                  position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)',
                  padding: '8px 12px', borderRadius: '8px', background: `${accentColor}06`, border: `1px solid ${accentColor}25`,
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', textAlign: 'center', zIndex: 2, minWidth: 60,
                }}>
                  <div style={{ color: accentColor, fontWeight: 600, fontSize: '12px' }}>{n.value}</div>
                  <div style={{ color: '#5A6478', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{n.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '28px', borderRadius: '10px', border: `1px dashed ${accentColor}25`, color: '#5A6478', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
          Add stats to generate network nodes
        </div>
      )}
      <SectionHead>OVERVIEW</SectionHead>
      <BodyText content={content} ov={ov} maxParagraphs={2} />
    </>
  );
}

function EditorialLayout(props) {
  const { content, ov, accentColor, SectionHead } = props;
  const sections = resolvedContent.body.split('\n').filter(Boolean);
  return (
    <>
      <StatRibbon stats={content.stats?.slice(0, 3)} ov={ov} accentColor={accentColor} />
      <SectionHead>TOP STORY</SectionHead>
      {sections.slice(0, 1).map((p, i) => (
        <p key={i} style={{ marginBottom: '18px', fontFamily: "'Inter', sans-serif", fontSize: '18px', color: '#D0D8E4', lineHeight: 1.75, fontWeight: 500 }}>{p}</p>
      ))}
      {/* Pull quote */}
      {sections[0] && (
        <div style={{
          padding: '16px 20px', margin: '12px 0', borderLeft: `3px solid ${accentColor}80`,
          background: `${accentColor}06`, borderRadius: '0 8px 8px 0',
          fontFamily: "'Inter', sans-serif", fontSize: '14px', fontStyle: 'italic',
          color: '#B0BAC8', lineHeight: 1.6,
        }}>
          &ldquo;{sections[0].slice(0, 120)}&hellip;&rdquo;
        </div>
      )}
      <SectionHead>BENEATH THE FOLD</SectionHead>
      {sections.slice(1, 3).map((p, i) => (
        <p key={i} style={{ marginBottom: '14px', fontFamily: "'Inter', sans-serif", fontSize: `${resolvedOv.body?.fontSize || 14}px`, color: '#B0BAC8', lineHeight: 1.75 }}>{p}</p>
      ))}
      <BigNumber content={content} ov={ov} accentColor={accentColor} />
    </>
  );
}

export {
  BodyLayout, StatsLayout, TableLayout, BullBearLayout, GridLayout, TimelineLayout, NetworkLayout, EditorialLayout,
  HeatmapLayout, CompareLayout, ScoreCardLayout, QuoteLayout,
  TierListLayout, PostmortemLayout, TrustStackLayout, PitchDeckLayout, MechanismLayout, ThesisLayout,
  CoverStoryLayout, ReceiptLayout, GlossaryLayout, MatrixLayout, ThreatModelLayout, FailureTreeLayout,
  FounderLayout, AnatomyLayout, FlowLayout, BracketLayout, ThreeLayerLayout, LongBetLayout,
  OrgChartLayout, PeriodicLayout, CurveLayout, FieldGuideLayout, MentalModelLayout, SubwayLayout,
  ConstellationLayout, StackLayout, TradeRoutesLayout,
};
