const makeStableId = (issueNum, prefix, index) => `${String(issueNum || '000').padStart(3, '0')}-${prefix}-${index + 1}`;

export function createDefaultEvidenceLedger(issueNum = '000') {
  return {
    issueNum: String(issueNum || '000'),
    fieldEntries: [],
    provenanceEntries: [],
    notes: [],
  };
}

export function normalizeEvidenceLedger(raw, issueNum = '000') {
  const base = raw && typeof raw === 'object' ? raw : {};
  const normalizedIssueNum = String(base.issueNum || issueNum || '000').trim();
  const normalizeEntry = (entry, prefix, index) => {
    const obj = entry && typeof entry === 'object' ? entry : {};
    return {
      id: String(obj.id || makeStableId(normalizedIssueNum, prefix, index)),
      issueNum: String(obj.issueNum || normalizedIssueNum).trim(),
      claimId: String(obj.claimId || '').trim(),
      claimPath: String(obj.claimPath || '').trim(),
      fieldId: String(obj.fieldId || '').trim(),
      provenanceId: String(obj.provenanceId || '').trim(),
      noteId: String(obj.noteId || '').trim(),
      content: String(obj.content || '').trim(),
    };
  };
  return {
    issueNum: normalizedIssueNum,
    fieldEntries: Array.isArray(base.fieldEntries) ? base.fieldEntries.map((e, i) => normalizeEntry(e, 'field', i)) : [],
    provenanceEntries: Array.isArray(base.provenanceEntries) ? base.provenanceEntries.map((e, i) => normalizeEntry(e, 'prov', i)) : [],
    notes: Array.isArray(base.notes) ? base.notes.map((e, i) => normalizeEntry(e, 'note', i)) : [],
  };
}

export function validateEvidenceLedger(raw, issueNum = '000') {
  const ledger = normalizeEvidenceLedger(raw, issueNum);
  const missing = [];
  const all = [...ledger.fieldEntries, ...ledger.provenanceEntries, ...ledger.notes];
  if (ledger.issueNum !== String(issueNum || '000')) missing.push('issueNum mismatch');
  if (!ledger.fieldEntries.length) missing.push('fieldEntries');
  if (!ledger.provenanceEntries.length) missing.push('provenanceEntries');
  if (!ledger.notes.length) missing.push('notes');
  const incompleteEntries = all.filter((entry) => !entry.id || !entry.content || !entry.issueNum || !entry.claimId || !entry.claimPath);
  const incomplete = incompleteEntries.length;
  if (incomplete) missing.push(`${incomplete} incomplete item(s)`);
  const unboundClaims = all.filter((entry) => !entry.issueNum || !entry.claimId || !entry.claimPath).length;
  if (unboundClaims) missing.push(`${unboundClaims} unbound claim item(s)`);
  return { total: all.length, complete: all.length - incomplete, missing, valid: missing.length === 0 };
}
