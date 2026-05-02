const TOKENS = {
  tier: {
    A: { className: 'chip-tier-A' }, B: { className: 'chip-tier-B' }, C: { className: 'chip-tier-C' }, D: { className: 'chip-tier-D' },
    E: { className: 'chip-tier-E' }, F: { className: 'chip-tier-F' }, G: { className: 'chip-tier-G' }, H: { className: 'chip-tier-H' },
  },
  category: {
    layout: { className: 'chip-category-layout' },
  },
  topic: {
    frame: { className: 'chip-topic-frame' },
  },
  status: {
    draft: { className: 'chip-status-draft' },
    wip: { className: 'chip-status-wip' },
    published: { className: 'chip-status-published' },
  },
  risk: {
    low: { className: 'chip-risk-low' },
    medium: { className: 'chip-risk-medium' },
    high: { className: 'chip-risk-high' },
  },
};

export function getSemanticChipToken(role, tone) {
  return TOKENS[role]?.[tone] || null;
}

export default function SemanticChip({ role, tone, children, className = '', style, title }) {
  const token = getSemanticChipToken(role, tone);
  if (!token) {
    throw new Error(`Unsupported SemanticChip token: ${role}/${tone}`);
  }
  return (
    <span className={`semantic-chip ${token.className} ${className}`.trim()} style={style} title={title}>
      {children}
    </span>
  );
}
