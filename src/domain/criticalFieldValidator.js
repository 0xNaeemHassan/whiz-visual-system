import { getCriticalFieldRegistry } from '../data/frameDatasetShapes';

const REQUIRED_PROVENANCE_KEYS = ['source', 'date', 'links'];

const normalizeProvenance = (value) => {
  const base = value && typeof value === 'object' ? value : {};
  return {
    source: String(base.source || '').trim(),
    date: String(base.date || '').trim(),
    links: String(base.links || '').trim(),
  };
};

const parseLinks = (links) => String(links || '').split(',').map((item) => item.trim()).filter(Boolean);

const isValidHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const hasMissingKeys = (provenance) => REQUIRED_PROVENANCE_KEYS.filter((key) => !provenance[key]);

function validateEntry({ value, provenance, path, label }) {
  const issues = [];
  const hasValue = String(value ?? '').trim() !== '';
  if (!hasValue) return issues;
  const normalizedProvenance = normalizeProvenance(provenance);
  const missing = hasMissingKeys(normalizedProvenance);
  if (missing.length) {
    issues.push({ path, label, reason: `missing provenance fields: ${missing.join(', ')}` });
    return issues;
  }
  const links = parseLinks(normalizedProvenance.links);
  if (!links.length || links.some((link) => !isValidHttpUrl(link))) {
    issues.push({ path, label, reason: 'invalid provenance links (use comma-separated http/https URLs)' });
  }
  return issues;
}

export function validateCriticalNumericFields({ layout, content }) {
  const registry = getCriticalFieldRegistry(layout);
  const issues = [];

  if (registry.bigNumber?.enabled) {
    issues.push(...validateEntry({ value: content?.bigNumber, provenance: content?.metricProvenance?.[0], path: 'bigNumber', label: 'Big Number' }));
  }

  if (registry.stats?.enabled && Array.isArray(content?.stats)) {
    content.stats.forEach((stat, index) => {
      issues.push(...validateEntry({ value: stat?.value, provenance: stat?.provenance, path: `stats[${index}].value`, label: 'Stat value' }));
    });
  }

  if (registry.table?.enabled && Array.isArray(content?.tableRows)) {
    content.tableRows.forEach((row, rowIndex) => {
      const hasNumericCell = Object.entries(row || {}).some(([key, val]) => key !== 'provenance' && /\d/.test(String(val || '')));
      if (hasNumericCell) {
        issues.push(...validateEntry({ value: 'numeric-cell', provenance: row?.provenance, path: `tableRows[${rowIndex}]`, label: 'Table numeric row' }));
      }
    });
  }

  if (registry.timeline?.enabled && Array.isArray(content?.timelineEvents)) {
    content.timelineEvents.forEach((event, index) => {
      const claim = [event?.label, event?.sub].map((v) => String(v || '').trim()).join(' ').trim();
      if (claim) {
        issues.push(...validateEntry({ value: claim, provenance: event?.provenance, path: `timelineEvents[${index}]`, label: 'Timeline claim' }));
      }
    });
  }

  return {
    valid: issues.length === 0,
    issues,
    missingSourceLinks: issues.some((issue) => issue.reason.includes('links') || issue.reason.includes('missing provenance fields')),
  };
}
