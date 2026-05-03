const TOKENS = {
  tier: {
    A: { className: 'chip-tier-A', label: 'Tier A', marker: '▲' }, B: { className: 'chip-tier-B', label: 'Tier B', marker: '◆' }, C: { className: 'chip-tier-C', label: 'Tier C', marker: '●' }, D: { className: 'chip-tier-D', label: 'Tier D', marker: '■' },
    E: { className: 'chip-tier-E', label: 'Tier E', marker: '⬢' }, F: { className: 'chip-tier-F', label: 'Tier F', marker: '⬣' }, G: { className: 'chip-tier-G', label: 'Tier G', marker: '✦' }, H: { className: 'chip-tier-H', label: 'Tier H', marker: '✶' },
  },
  category: {
    layout: { className: 'chip-category-layout', label: 'Layout', marker: '▤' },
  },
  topic: {
    frame: { className: 'chip-topic-frame', label: 'Frame', marker: '◈' },
  },
  status: {
    draft: { className: 'chip-status-draft', label: 'Draft', marker: '◌' },
    wip: { className: 'chip-status-wip', label: 'Work in progress', marker: '◐' },
    published: { className: 'chip-status-published', label: 'Published', marker: '●' },
  },
  risk: {
    low: { className: 'chip-risk-low', label: 'Low risk', marker: '○' },
    medium: { className: 'chip-risk-medium', label: 'Medium risk', marker: '△' },
    high: { className: 'chip-risk-high', label: 'High risk', marker: '▲' },
    critical: { className: 'chip-risk-high', label: 'Critical risk', marker: '◆' },
    med: { className: 'chip-risk-medium', label: 'Medium risk', marker: '△' },
  },
  severity: {
    low: { className: 'chip-risk-low', label: 'Low severity', marker: '○' },
    medium: { className: 'chip-risk-medium', label: 'Medium severity', marker: '△' },
    high: { className: 'chip-risk-high', label: 'High severity', marker: '▲' },
    critical: { className: 'chip-risk-high', label: 'Critical severity', marker: '◆' },
  },
};

export function getSemanticChipToken(role, tone) {
  return TOKENS[role]?.[tone] || null;
}

export function semanticLabel(role, tone) {
  return getSemanticChipToken(role, String(tone || '').toLowerCase())?.label || String(tone || role || '').toUpperCase();
}

export function SemanticMarker({ role, tone, text, className = '', style, title }) {
  const normalizedTone = String(tone || '').toLowerCase();
  const token = getSemanticChipToken(role, normalizedTone);
  if (!token) {
    throw new Error(`Unsupported SemanticChip token: ${role}/${tone}`);
  }
  return (
    <span className={`semantic-chip ${token.className} ${className}`.trim()} style={style} title={title || token.label}>
      <span aria-hidden="true" style={{ fontSize: '0.95em' }}>{token.marker}</span>
      <span>{text || token.label}</span>
    </span>
  );
}

export default function SemanticChip({ role, tone, children, className = '', style, title }) {
  const normalizedTone = String(tone || '').toLowerCase();
  const token = getSemanticChipToken(role, normalizedTone);
  if (!token) {
    throw new Error(`Unsupported SemanticChip token: ${role}/${tone}`);
  }
  return (
    <span className={`semantic-chip ${token.className} ${className}`.trim()} style={style} title={title || token.label}>
      <span aria-hidden="true" style={{ fontSize: '0.95em' }}>{token.marker}</span>
      <span>{children || token.label}</span>
    </span>
  );
}
