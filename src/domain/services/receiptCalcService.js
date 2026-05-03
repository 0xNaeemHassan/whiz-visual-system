const toNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,%\s,]/g, '');
    if (!cleaned) return null;
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toSignedValue = (row) => {
  const amount = toNumber(row?.amount);
  if (amount !== null) return amount;

  const feeUsd = toNumber(row?.feeUsd);
  if (feeUsd === null) return 0;

  const type = row?.type || row?.col4;
  return type === 'benefit' ? Math.abs(feeUsd) : -Math.abs(feeUsd);
};

export function calculateReceiptSummary(rows = []) {
  const normalizedRows = rows.map((row) => {
    const amount = toSignedValue(row);
    const type = row?.type || row?.col4 || (amount >= 0 ? 'benefit' : 'fee');
    const bps = toNumber(row?.bps);
    const feeUsd = toNumber(row?.feeUsd);
    const impliedFee = bps !== null ? Math.abs((Math.abs(amount) * bps) / 10000) : null;
    const isManualMismatch =
      feeUsd !== null && impliedFee !== null && Math.abs(feeUsd - impliedFee) > 0.01;

    return { amount, type, bps, feeUsd, impliedFee, isManualMismatch };
  });

  const subtotalFees = normalizedRows
    .filter((row) => row.amount < 0)
    .reduce((sum, row) => sum + Math.abs(row.amount), 0);

  const totalBenefits = normalizedRows
    .filter((row) => row.amount > 0)
    .reduce((sum, row) => sum + row.amount, 0);

  const netResult = totalBenefits - subtotalFees;
  const feeRowsWithBps = normalizedRows.filter((row) => row.amount < 0 && row.bps !== null);
  const weightedNotional = feeRowsWithBps.reduce((sum, row) => sum + Math.abs(row.amount), 0);
  const weightedBpsTotal = feeRowsWithBps.reduce((sum, row) => sum + Math.abs(row.amount) * (row.bps || 0), 0);
  const impliedSlippageBps = weightedNotional > 0 ? weightedBpsTotal / weightedNotional : null;

  return {
    rows: normalizedRows,
    subtotalFees,
    totalBenefits,
    netResult,
    impliedSlippageBps,
    hasManualMismatch: normalizedRows.some((row) => row.isManualMismatch),
  };
}
