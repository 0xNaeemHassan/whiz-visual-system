const NON_NUMERIC = /[^0-9+\-.,%]/g;

function parseNumeric(value) {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value).trim();
  if (!raw) return null;
  const cleaned = raw.replace(NON_NUMERIC, '').replace(/,/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '+') return null;
  const numeric = Number(cleaned.replace('%', ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function sumPercentages(stats = []) {
  return stats.reduce((total, stat) => {
    const val = stat?.value;
    if (typeof val === 'string' && val.includes('%')) {
      const num = parseNumeric(val);
      return num == null ? total : total + num;
    }
    return total;
  }, 0);
}

function defaultRules() {
  return [
    {
      id: 'CR_PERCENT_TOTAL_GT_100',
      code: 'CONSTRAINT_PERCENT_TOTAL_GT_100',
      message: 'Percent subtotals exceed 100%.',
      evaluate: ({ content }) => {
        const total = sumPercentages(content?.stats || []);
        return total > 100.0001 ? { total } : null;
      },
      path: 'content.stats',
    },
    {
      id: 'CR_NEGATIVE_VALUE_FORBIDDEN',
      code: 'CONSTRAINT_NEGATIVE_FORBIDDEN',
      message: 'Negative values are not allowed in positive-only table columns.',
      evaluate: ({ content }) => {
        const rows = Array.isArray(content?.tableRows) ? content.tableRows : [];
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
          const row = rows[rowIndex] || {};
          for (const [column, cell] of Object.entries(row)) {
            if (column === 'provenance') continue;
            const value = parseNumeric(cell);
            if (value != null && value < 0 && /^(col2|col3|value|amount|total)$/i.test(column)) {
              return { rowIndex, column, value };
            }
          }
        }
        return null;
      },
      path: 'content.tableRows',
    },
  ];
}

const frameRuleRegistry = new Map([
  ['default', defaultRules()],
]);

const IMPOSSIBLE_STATE_RULES = [
  {
    id: 'IMP_RATE_LABEL_REQUIRES_PERCENT',
    message: 'Rate-like labels should include percentage values.',
    severity: 'blocking',
    confidence: 'high',
    domains: ['finance', 'macro', 'default'],
    layouts: ['stat-grid', 'kpi-strip', 'default'],
    evaluate: ({ stat, label, value }) => {
      if ((label.includes('apy') || label.includes('rate') || label.includes('%')) && !value.includes('%')) {
        return {
          fieldPath: `content.stats[${stat.index}].value`,
          remediation: 'Add a percent sign or change the label to a non-rate metric.',
        };
      }
      return null;
    },
  },
  {
    id: 'IMP_SHARE_LABEL_REQUIRES_PERCENT',
    message: 'Share/mix labels should use percentage values.',
    severity: 'blocking',
    confidence: 'high',
    domains: ['finance', 'macro', 'default'],
    layouts: ['stat-grid', 'default'],
    evaluate: ({ stat, label, value }) => {
      if ((label.includes('share') || label.includes('mix')) && !value.includes('%')) {
        return {
          fieldPath: `content.stats[${stat.index}].value`,
          remediation: 'Use a percentage value for share/mix metrics.',
        };
      }
      return null;
    },
  },
];

export function evaluateConstraintRegistry({ frameId, layoutId, content }) {
  const rules = frameRuleRegistry.get(String(frameId)) || frameRuleRegistry.get(layoutId) || frameRuleRegistry.get('default') || [];
  const violations = [];
  rules.forEach((rule) => {
    const detail = rule.evaluate({ frameId, layoutId, content });
    if (detail) {
      violations.push({
        ruleId: rule.id,
        code: rule.code,
        path: rule.path,
        message: rule.message,
        detail,
      });
    }
  });
  return violations;
}

function includesContext(scope = [], value = 'default') {
  return scope.includes('default') || scope.includes(value);
}

export function evaluateImpossibleStateConstraints({ content = {}, layoutId = 'default', domain = 'default' } = {}) {
  const stats = Array.isArray(content?.stats) ? content.stats : [];
  const findings = [];
  stats.forEach((stat, index) => {
    const label = String(stat?.label || '').trim().toLowerCase();
    const value = String(stat?.value || '').trim().toLowerCase();
    IMPOSSIBLE_STATE_RULES.forEach((rule) => {
      if (!includesContext(rule.layouts, layoutId) || !includesContext(rule.domains, domain)) return;
      const result = rule.evaluate({ stat: { ...stat, index }, label, value, layoutId, domain, content });
      if (!result) return;
      findings.push({
        ruleId: rule.id,
        severity: rule.severity,
        confidence: rule.confidence,
        message: rule.message,
        fieldPath: result.fieldPath || `content.stats[${index}]`,
        remediation: result.remediation || 'Review metric label and value pairing.',
      });
    });
  });
  return findings;
}

export function getConstraintRuleIds(violations = []) {
  return [...new Set(violations.map((entry) => entry.ruleId).filter(Boolean))].sort();
}
