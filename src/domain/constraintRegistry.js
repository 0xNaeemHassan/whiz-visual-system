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

export function getConstraintRuleIds(violations = []) {
  return [...new Set(violations.map((entry) => entry.ruleId).filter(Boolean))].sort();
}
