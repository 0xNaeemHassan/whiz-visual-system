function parseNumeric(value) {
  if (typeof value !== 'string') return Number.NaN;
  const normalized = value.replace(/[$,%\s,]/g, '');
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : Number.NaN;
}

export function validateDefaultSort({ defaultSort, tableHeaders = [], tableRows = [] }) {
  if (!defaultSort) return;
  const allowedModes = new Set(['numeric', 'text']);
  const allowedDirections = new Set(['asc', 'desc']);
  if (!allowedModes.has(defaultSort.mode)) throw new Error(`Invalid defaultSort mode: ${defaultSort.mode}`);
  if (!allowedDirections.has(defaultSort.direction)) throw new Error(`Invalid defaultSort direction: ${defaultSort.direction}`);

  const columnIndex = tableHeaders.findIndex((header) => header === defaultSort.column);
  if (columnIndex < 0) throw new Error(`defaultSort column not found in headers: ${defaultSort.column}`);

  const rowKey = `col${columnIndex + 1}`;
  const missingRow = tableRows.find((row) => !(row && typeof row === 'object' && rowKey in row));
  if (missingRow) throw new Error(`defaultSort column ${defaultSort.column} missing from table row schema (${rowKey})`);
}

export function applyDefaultSort(tableRows = [], tableHeaders = [], defaultSort) {
  if (!defaultSort || !Array.isArray(tableRows) || tableRows.length === 0) return tableRows;
  const columnIndex = tableHeaders.findIndex((header) => header === defaultSort.column);
  if (columnIndex < 0) return tableRows;
  const key = `col${columnIndex + 1}`;
  const direction = defaultSort.direction === 'asc' ? 1 : -1;

  return [...tableRows].sort((a, b) => {
    const left = a?.[key] ?? '';
    const right = b?.[key] ?? '';
    if (defaultSort.mode === 'numeric') {
      const ln = parseNumeric(left);
      const rn = parseNumeric(right);
      if (Number.isFinite(ln) && Number.isFinite(rn)) return (ln - rn) * direction;
      if (Number.isFinite(ln)) return -1 * direction;
      if (Number.isFinite(rn)) return 1 * direction;
    }
    return String(left).localeCompare(String(right), undefined, { sensitivity: 'base' }) * direction;
  });
}
