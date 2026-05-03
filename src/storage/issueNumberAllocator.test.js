import { describe, expect, it } from 'vitest';

import { applyStorageMigrations } from './migrations';
import { createIssueNumberAllocator } from './issueNumberAllocator';

describe('issue number allocator', () => {
  it('reserves monotonically and avoids collisions in rapid duplicate-like sequences', () => {
    const allocator = createIssueNumberAllocator([{ issueNum: '001' }, { issueNum: '002' }]);
    const first = allocator.reserveNext();
    const second = allocator.reserveNext();
    const third = allocator.reserveSpecific('002');

    expect(first).toBe('003');
    expect(second).toBe('004');
    expect(third).toBe('005');
  });

  it('reconciles imported overlapping issue numbers', () => {
    const allocator = createIssueNumberAllocator([{ issueNum: '001' }, { issueNum: '003' }]);
    const reconciled = allocator.reconcile([{ id: 'a', issueNum: '003' }, { id: 'b', issueNum: '004' }, { id: 'c', issueNum: '' }]);

    expect(reconciled.map((i) => i.issueNum)).toEqual(['002', '004', '005']);
  });

  it('keeps reserved numbers monotonic across rollback-like retries', () => {
    const allocator = createIssueNumberAllocator([{ issueNum: '010' }]);
    const allocated = [allocator.reserveNext(), allocator.reserveNext()];
    const retry = allocator.reserveNext();

    expect(allocated).toEqual(['001', '002']);
    expect(retry).toBe('003');
  });
});

describe('planner issue migration repair', () => {
  it('repairs duplicate legacy issue numbers and publishes remap metadata', () => {
    const migrated = applyStorageMigrations('whiz-issues', [
      { id: '1', issueNum: '001' },
      { id: '2', issueNum: '001' },
      { id: '3', issueNum: '000' },
    ]);

    expect(migrated.ok).toBe(true);
    expect(migrated.value.data.map((x) => x.issueNum)).toEqual(['001', '002', '003']);
    expect(migrated.value.metadata.issueNumRemap).toEqual({ '000': ['003'], '001': ['002'] });
  });
});
