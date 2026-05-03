import React from 'react';

let labeledFieldIdCounter = 0;

export function IconButton({ label, title, children, type = 'button', ...props }) {
  return (
    <button type={type} aria-label={label} title={title || label} {...props}>
      {children}
    </button>
  );
}

export const AccessibleIconButton = IconButton;

export function LabeledField({ label, id, className = 'form-group', labelClassName = 'form-label', children, style }) {
  const fallbackId = React.useMemo(() => {
    labeledFieldIdCounter += 1;
    return `labeled-field-${labeledFieldIdCounter}`;
  }, []);
  const fieldId = id || fallbackId;
  const control = React.cloneElement(children, {
    id: children.props.id || fieldId,
    'aria-labelledby': children.props['aria-labelledby'] || `${fieldId}-label`,
  });
  return (
    <div className={className} style={style}>
      <label id={`${fieldId}-label`} className={labelClassName} htmlFor={fieldId}>{label}</label>
      {control}
    </div>
  );
}

const CHIP_TOKENS = {
  status: {
    published: { color: '#3CE6A6', background: 'rgba(60,230,166,0.12)' },
    draft: { color: '#E5B23A', background: 'rgba(229,178,58,0.12)' },
    wip: { color: '#FF8A3D', background: 'rgba(255,138,61,0.12)' },
    archived: { color: '#8B95A3', background: 'rgba(139,149,163,0.12)' },
    default: { color: '#8B95A3', background: 'rgba(139,149,163,0.12)' },
  },
  category: {
    default: { color: 'var(--dim)', background: 'var(--bg-3)', borderColor: 'var(--border)' },
  },
  risk: {
    low: { color: '#3CE6A6', background: 'rgba(60,230,166,0.12)' },
    med: { color: '#E5B23A', background: 'rgba(229,178,58,0.12)' },
    high: { color: '#FF5A5A', background: 'rgba(255,90,90,0.12)' },
    default: { color: '#8B95A3', background: 'rgba(139,149,163,0.12)' },
  },
};

export function SemanticChip({ kind = 'category', value = '', children, style }) {
  const key = String(value || '').toLowerCase();
  const tokenSet = CHIP_TOKENS[kind] || CHIP_TOKENS.category;
  const tokens = tokenSet[key] || tokenSet.default || CHIP_TOKENS.category.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: 'var(--font-m)', fontSize: 9, lineHeight: 1.2,
      textTransform: 'uppercase', letterSpacing: '0.06em',
      borderRadius: 999, padding: '3px 7px', border: `1px solid ${tokens.borderColor || 'transparent'}`,
      color: tokens.color, background: tokens.background,
      ...style,
    }}>
      {children || value}
    </span>
  );
}

const SPARKLINE_STROKES = { thin: 1.25, regular: 1.75, thick: 2.25 };
const ROLE_COLORS = {
  accent: (c) => c,
  subtle: (c) => `${c}99`,
  contrast: () => '#F4F5F7',
};

export function Sparkline({
  values = [],
  width = 80,
  height = 36,
  strokeWidth = 'regular',
  colorRole = 'accent',
  accentColor = '#6FA8FF',
  baseline = 'none',
  marker = 'last',
}) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 2;
  const toX = (i) => pad + (i / Math.max(values.length - 1, 1)) * (width - pad * 2);
  const toY = (v) => pad + (1 - (v - min) / range) * (height - pad * 2);
  const pts = values.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
  const stroke = (ROLE_COLORS[colorRole] || ROLE_COLORS.accent)(accentColor);
  const yBase = baseline === 'min' ? toY(min) : baseline === 'mid' ? toY((min + max) / 2) : null;
  const markers = marker === 'all' ? values.map((v, i) => [toX(i), toY(v)]) : marker === 'last' ? [[toX(values.length - 1), toY(values[values.length - 1])]] : [];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', display: 'block' }}>
      {yBase !== null && <line x1={pad} x2={width - pad} y1={yBase} y2={yBase} stroke={`${stroke}55`} strokeWidth="1" strokeDasharray="2,2" />}
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={SPARKLINE_STROKES[strokeWidth] || SPARKLINE_STROKES.regular} strokeLinejoin="round" strokeLinecap="round" />
      {markers.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.2" fill={stroke} stroke="none" />)}
    </svg>
  );
}
