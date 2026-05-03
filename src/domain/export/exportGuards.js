export function shouldBlockStrictExportForUnsnapshottedEdits({
  strictMode,
  isSnapshotLockCurrent,
  guardEnabled = true,
  action = 'export',
} = {}) {
  if (!guardEnabled) return false;
  if (!strictMode) return false;
  if (action !== 'export' && action !== 'publish') return false;
  return !isSnapshotLockCurrent;
}
