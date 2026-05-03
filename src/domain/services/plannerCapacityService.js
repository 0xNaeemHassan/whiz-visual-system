const DEFAULT_COMPLEXITY = 3;

export function normalizeCapacityModel(raw = {}) {
  const safe = raw && typeof raw === 'object' ? raw : {};
  return {
    creators: Array.isArray(safe.creators) ? safe.creators : [],
    reviewers: Array.isArray(safe.reviewers) ? safe.reviewers : [],
  };
}

function personMap(people = []) {
  return new Map(people.map((person) => [person.id, {
    ...person,
    weeklySlots: Number(person.weeklySlots) || 0,
    complexityBudget: Number(person.complexityBudget) || 0,
    plannedPTO: Array.isArray(person.plannedPTO) ? person.plannedPTO : [],
  }]));
}

export function evaluateCapacity({ issues = [], model = {} }) {
  const normalized = normalizeCapacityModel(model);
  const creators = personMap(normalized.creators);
  const reviewers = personMap(normalized.reviewers);
  const result = { creator: {}, reviewer: {} };

  for (const [kind, pool, key] of [
    ['creator', creators, 'ownerId'],
    ['reviewer', reviewers, 'reviewerId'],
  ]) {
    for (const [id, person] of pool) {
      const assigned = issues.filter((issue) => issue[key] === id);
      const weeklySlotsUsed = assigned.length;
      const complexityUsed = assigned.reduce((sum, issue) => sum + (Number(issue.complexityPoints) || DEFAULT_COMPLEXITY), 0);
      const ptoCollisionCount = assigned.filter((issue) => person.plannedPTO.includes(issue.publishDate)).length;
      const slotDelta = person.weeklySlots - weeklySlotsUsed;
      const complexityDelta = person.complexityBudget - complexityUsed;
      const overloaded = slotDelta < 0 || complexityDelta < 0 || ptoCollisionCount > 0;
      result[kind][id] = {
        ...person,
        weeklySlotsUsed,
        complexityUsed,
        ptoCollisionCount,
        slotDelta,
        complexityDelta,
        signal: overloaded ? 'overload' : (slotDelta >= 2 && complexityDelta >= 4 ? 'underload' : 'balanced'),
      };
    }
  }

  return result;
}

export function suggestRebalance({ issues = [], model = {} }) {
  const cap = evaluateCapacity({ issues, model });
  const suggestions = [];
  const owners = Object.values(cap.creator);
  const overloaded = owners.filter((p) => p.signal === 'overload').sort((a, b) => a.slotDelta - b.slotDelta);
  const underloaded = owners.filter((p) => p.signal === 'underload').sort((a, b) => b.slotDelta - a.slotDelta);

  for (const heavy of overloaded) {
    const candidates = issues
      .filter((issue) => issue.ownerId === heavy.id)
      .sort((a, b) => (Number(b.complexityPoints) || DEFAULT_COMPLEXITY) - (Number(a.complexityPoints) || DEFAULT_COMPLEXITY));
    for (const issue of candidates) {
      const target = underloaded.find((u) => !u.plannedPTO.includes(issue.publishDate));
      if (!target) continue;
      suggestions.push({ issueId: issue.id, type: 'owner', from: heavy.id, to: target.id, publishDate: issue.publishDate });
      target.slotDelta -= 1;
      heavy.slotDelta += 1;
      if (heavy.slotDelta >= 0) break;
    }
  }

  return suggestions;
}

export function fairnessScore(issues = []) {
  const byOwner = issues.reduce((acc, issue) => {
    const key = issue.ownerId || 'unassigned';
    acc[key] = (acc[key] || 0) + (Number(issue.complexityPoints) || DEFAULT_COMPLEXITY);
    return acc;
  }, {});
  const values = Object.values(byOwner);
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, value) => acc + ((value - mean) ** 2), 0) / values.length;
  return variance;
}
