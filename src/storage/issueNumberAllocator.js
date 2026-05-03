export function normalizeIssueNum(value) {
  return String(value || '').replace(/\D/g, '').slice(-3).padStart(3, '0');
}

function toNumeric(issueNum) {
  const num = Number.parseInt(normalizeIssueNum(issueNum), 10);
  return Number.isFinite(num) ? num : 0;
}

export function createIssueNumberAllocator(items = []) {
  const reserved = new Set(items.map((item) => normalizeIssueNum(item?.issueNum)).filter((value) => value !== '000'));

  const findNext = () => {
    let candidate = 1;
    while (reserved.has(String(candidate).padStart(3, '0'))) candidate += 1;
    return String(candidate).padStart(3, '0');
  };

  const reserveNext = () => {
    const issueNum = findNext();
    reserved.add(issueNum);
    return issueNum;
  };

  const reserveSpecific = (requested) => {
    const normalized = normalizeIssueNum(requested);
    if (normalized !== '000' && !reserved.has(normalized)) {
      reserved.add(normalized);
      return normalized;
    }
    return reserveNext();
  };

  const reconcile = (incomingItems = []) => incomingItems.map((item) => ({ ...item, issueNum: reserveSpecific(item?.issueNum) }));

  return { reserveNext, reserveSpecific, reconcile, peekNext: findNext, snapshot: () => new Set(reserved) };
}

export function repairDuplicateIssueNumbers(items = []) {
  const allocator = createIssueNumberAllocator([]);
  const seen = new Set();
  const mapping = {};
  const repaired = items.map((item) => {
    const original = normalizeIssueNum(item?.issueNum);
    const hasCollision = original === '000' || seen.has(original);
    const issueNum = hasCollision ? allocator.reserveNext() : allocator.reserveSpecific(original);
    seen.add(issueNum);
    if (original !== issueNum) mapping[original || '000'] = mapping[original || '000'] || [];
    if (original !== issueNum) mapping[original || '000'].push(issueNum);
    return { ...item, issueNum };
  });

  return {
    items: repaired,
    metadata: {
      issueNumRemap: mapping,
      repairedAt: Date.now(),
    },
  };
}

export function getHighestIssueNumber(items = []) {
  return items.reduce((max, item) => Math.max(max, toNumeric(item?.issueNum)), 0);
}
